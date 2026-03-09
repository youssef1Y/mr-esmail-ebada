import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sendSMS(phone: string, message: string) {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID")!;
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN")!;
  const fromPhone = Deno.env.get("TWILIO_PHONE_NUMBER")!;

  let intlPhone = phone;
  if (phone.startsWith("0")) intlPhone = "+2" + phone;
  else if (!phone.startsWith("+")) intlPhone = "+" + phone;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const body = new URLSearchParams({ To: intlPhone, From: fromPhone, Body: message });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + btoa(`${accountSid}:${authToken}`),
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Twilio SMS error:", errText);
    throw new Error("Failed to send SMS");
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify admin
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      if (!user) {
        return new Response(JSON.stringify({ error: "غير مصرح" }), {
          status: 401, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      if (!role) {
        return new Response(JSON.stringify({ error: "غير مصرح" }), {
          status: 403, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    const body = await req.json().catch(() => ({}));
    const targetPhone = body.target_phone; // optional: send to specific parent

    // Get week boundaries
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekAgoISO = weekAgo.toISOString();

    // Get all parent accounts (or specific one)
    let parentQuery = supabase.from("parent_accounts").select("id, phone, full_name");
    if (targetPhone) parentQuery = parentQuery.eq("phone", targetPhone);
    const { data: parents } = await parentQuery;

    if (!parents || parents.length === 0) {
      return new Response(JSON.stringify({ message: "لا يوجد أولياء أمور", sent: 0 }), {
        status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let sentCount = 0;
    const errors: string[] = [];

    for (const parent of parents) {
      try {
        // Get linked students
        const { data: students } = await supabase
          .from("profiles")
          .select("user_id, full_name, grade")
          .eq("parent_phone", parent.phone);

        if (!students || students.length === 0) continue;

        let reportLines: string[] = [
          `📊 التقرير الأسبوعي`,
          `أهلاً ${parent.full_name}`,
          `---`,
        ];

        for (const student of students) {
          const uid = student.user_id;

          // Parallel fetch weekly data
          const [viewsRes, hwSubsRes, examAttemptsRes, pointsRes, rankRes] = await Promise.all([
            supabase.from("video_views").select("id").eq("user_id", uid).gte("viewed_at", weekAgoISO),
            supabase.from("video_homework_submissions").select("score, total").eq("user_id", uid).gte("submitted_at", weekAgoISO),
            supabase.from("exam_attempts").select("score, total").eq("user_id", uid).gte("submitted_at", weekAgoISO),
            supabase.from("student_points").select("points").eq("user_id", uid),
            supabase.rpc("get_student_rank", { p_user_id: uid }),
          ]);

          const weeklyViews = viewsRes.data?.length || 0;
          const weeklyHw = hwSubsRes.data || [];
          const weeklyExams = examAttemptsRes.data || [];
          const totalPoints = (pointsRes.data || []).reduce((sum: number, p: any) => sum + p.points, 0);
          const rank = rankRes.data?.[0] || { rank: 0, total_students: 0 };

          // Calculate averages
          const hwAvg = weeklyHw.length > 0
            ? Math.round(weeklyHw.reduce((s: number, h: any) => s + ((h.score || 0) / (h.total || 1)) * 100, 0) / weeklyHw.length)
            : 0;
          const examAvg = weeklyExams.length > 0
            ? Math.round(weeklyExams.reduce((s: number, e: any) => s + ((e.score || 0) / (e.total || 1)) * 100, 0) / weeklyExams.length)
            : 0;

          // Pending homework
          const { data: allHw } = await supabase.from("homework").select("id").eq("grade", student.grade);
          const { data: doneHw } = await supabase.from("homework_submissions").select("homework_id").eq("user_id", uid);
          const doneSet = new Set((doneHw || []).map((h: any) => h.homework_id));
          const pendingCount = (allHw || []).filter((h: any) => !doneSet.has(h.id)).length;

          reportLines.push(`👤 ${student.full_name} (${student.grade})`);
          reportLines.push(`📹 فيديوهات هذا الأسبوع: ${weeklyViews}`);
          reportLines.push(`📝 واجبات مسلّمة: ${weeklyHw.length} (متوسط: ${hwAvg}%)`);
          reportLines.push(`📋 امتحانات: ${weeklyExams.length} (متوسط: ${examAvg}%)`);
          reportLines.push(`⭐ النقاط: ${totalPoints} | الترتيب: ${rank.rank}/${rank.total_students}`);
          if (pendingCount > 0) {
            reportLines.push(`⚠️ واجبات متأخرة: ${pendingCount}`);
          }
          reportLines.push(`---`);
        }

        reportLines.push(`منصة الأستاذ إسماعيل أحمد عباده`);

        const message = reportLines.join("\n");

        await sendSMS(parent.phone, message);
        sentCount++;

        // Also store notification for each student
        for (const student of students) {
          await supabase.from("student_notifications").insert({
            user_id: student.user_id,
            title: "تم إرسال التقرير الأسبوعي",
            body: "تم إرسال تقرير أدائك الأسبوعي لولي أمرك",
            type: "report",
          });
        }
      } catch (err) {
        console.error(`Error sending to ${parent.phone}:`, err);
        errors.push(parent.phone);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      sent: sentCount,
      total: parents.length,
      errors: errors.length > 0 ? errors : undefined,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    console.error("Weekly report error:", err);
    return new Response(JSON.stringify({ error: "حدث خطأ" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
