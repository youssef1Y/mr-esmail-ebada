import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuth = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!twilioSid || !twilioAuth || !twilioPhone) {
      throw new Error("Twilio credentials not configured");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const adminPhone = body.admin_phone || "";
    const sendToParents = body.send_to_parents !== false;

    // Fetch all profiles
    const { data: profiles, error: profErr } = await supabase
      .from("profiles")
      .select("*")
      .order("grade", { ascending: true });

    if (profErr) throw profErr;
    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "لا يوجد طلاب" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userIds = profiles.map((p: any) => p.user_id);

    // Fetch stats for all students in parallel
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [attemptsRes, hwSubsRes, viewsRes, pointsRes] = await Promise.all([
      supabase.from("exam_attempts").select("user_id, score, total, submitted_at").in("user_id", userIds).gte("submitted_at", oneWeekAgo),
      supabase.from("homework_submissions").select("user_id, score, submitted_at").in("user_id", userIds).gte("submitted_at", oneWeekAgo),
      supabase.from("video_views").select("user_id, viewed_at").in("user_id", userIds).gte("viewed_at", oneWeekAgo),
      supabase.from("student_points").select("user_id, points").in("user_id", userIds),
    ]);

    const attempts = attemptsRes.data || [];
    const hwSubs = hwSubsRes.data || [];
    const views = viewsRes.data || [];
    const points = pointsRes.data || [];

    // Group by user
    const userStats: Record<string, any> = {};
    profiles.forEach((p: any) => {
      userStats[p.user_id] = {
        name: p.full_name,
        grade: p.grade,
        is_subscribed: p.is_subscribed,
        parent_phone: p.parent_phone,
        student_phone: p.student_phone,
        exams: 0,
        avg_score: 0,
        total_score: 0,
        homework_done: 0,
        videos_watched: 0,
        total_points: 0,
      };
    });

    attempts.forEach((a: any) => {
      if (userStats[a.user_id]) {
        userStats[a.user_id].exams++;
        userStats[a.user_id].total_score += a.total > 0 ? ((a.score || 0) / a.total) * 100 : 0;
      }
    });

    hwSubs.forEach((h: any) => {
      if (userStats[h.user_id]) userStats[h.user_id].homework_done++;
    });

    views.forEach((v: any) => {
      if (userStats[v.user_id]) userStats[v.user_id].videos_watched++;
    });

    points.forEach((p: any) => {
      if (userStats[p.user_id]) userStats[p.user_id].total_points += p.points;
    });

    // Calculate averages
    Object.values(userStats).forEach((s: any) => {
      s.avg_score = s.exams > 0 ? Math.round(s.total_score / s.exams) : 0;
    });

    // Group students by grade
    const gradeGroups: Record<string, any[]> = {};
    Object.values(userStats).forEach((s: any) => {
      if (!gradeGroups[s.grade]) gradeGroups[s.grade] = [];
      gradeGroups[s.grade].push(s);
    });

    // Build admin report
    let adminReport = `📊 *التقرير الأسبوعي لأداء الطلاب*\n📅 ${new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}\n\n`;

    const gradeOrder = [
      "الصف الأول الإعدادي", "الصف الثاني الإعدادي", "الصف الثالث الإعدادي",
      "الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي",
    ];

    for (const grade of gradeOrder) {
      const students = gradeGroups[grade];
      if (!students || students.length === 0) continue;

      adminReport += `\n📚 *${grade}* (${students.length} طالب)\n${"─".repeat(25)}\n`;

      students.forEach((s: any, i: number) => {
        adminReport += `\n${i + 1}. *${s.name}*\n`;
        adminReport += `   📱 ${s.student_phone}\n`;
        adminReport += `   ${s.is_subscribed ? "✅ مشترك" : "❌ غير مشترك"}\n`;
        adminReport += `   📝 الامتحانات: ${s.exams} (متوسط: ${s.avg_score}%)\n`;
        adminReport += `   📋 الواجبات: ${s.homework_done} واجب\n`;
        adminReport += `   🎬 الفيديوهات: ${s.videos_watched} فيديو\n`;
        adminReport += `   🏆 النقاط: ${s.total_points}\n`;
      });
    }

    // Send admin report via WhatsApp
    const sendWhatsApp = async (to: string, message: string) => {
      const formattedTo = to.startsWith("+") ? to : `+2${to}`;
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
      const formData = new URLSearchParams();
      formData.append("To", `whatsapp:${formattedTo}`);
      formData.append("From", `whatsapp:${twilioPhone}`);
      formData.append("Body", message);

      const response = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          "Authorization": "Basic " + btoa(`${twilioSid}:${twilioAuth}`),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      const result = await response.json();
      if (!response.ok) {
        console.error("Twilio error:", result);
      }
      return response.ok;
    };

    let sentCount = 0;
    let failedCount = 0;

    // Send to admin
    if (adminPhone) {
      const success = await sendWhatsApp(adminPhone, adminReport);
      if (success) sentCount++;
      else failedCount++;
    }

    // Send individual reports to parents
    if (sendToParents) {
      for (const student of Object.values(userStats) as any[]) {
        const parentPhone = student.parent_phone;
        if (!parentPhone) continue;

        let parentReport = `📊 *تقرير أداء الطالب الأسبوعي*\n`;
        parentReport += `📅 ${new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}\n\n`;
        parentReport += `👤 *${student.name}*\n`;
        parentReport += `📚 ${student.grade}\n`;
        parentReport += `${student.is_subscribed ? "✅ مشترك" : "❌ غير مشترك"}\n\n`;
        parentReport += `📝 الامتحانات هذا الأسبوع: ${student.exams}\n`;
        parentReport += `📊 متوسط الدرجات: ${student.avg_score}%\n`;
        parentReport += `📋 الواجبات المسلمة: ${student.homework_done}\n`;
        parentReport += `🎬 الفيديوهات المشاهدة: ${student.videos_watched}\n`;
        parentReport += `🏆 إجمالي النقاط: ${student.total_points}\n\n`;
        parentReport += `_منصة الأستاذ إسماعيل أحمد عبادة_`;

        const success = await sendWhatsApp(parentPhone, parentReport);
        if (success) sentCount++;
        else failedCount++;

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `تم إرسال ${sentCount} رسالة بنجاح${failedCount > 0 ? ` (${failedCount} فشل)` : ""}`,
      sent: sentCount,
      failed: failedCount,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
