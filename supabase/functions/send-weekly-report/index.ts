import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify admin if called via HTTP
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
    const targetPhone = body.target_phone;

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekAgoISO = weekAgo.toISOString();

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
        const { data: students } = await supabase
          .from("profiles")
          .select("user_id, full_name, grade")
          .eq("parent_phone", parent.phone);

        if (!students || students.length === 0) continue;

        for (const student of students) {
          const uid = student.user_id;

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

          const hwAvg = weeklyHw.length > 0
            ? Math.round(weeklyHw.reduce((s: number, h: any) => s + ((h.score || 0) / (h.total || 1)) * 100, 0) / weeklyHw.length)
            : 0;
          const examAvg = weeklyExams.length > 0
            ? Math.round(weeklyExams.reduce((s: number, e: any) => s + ((e.score || 0) / (e.total || 1)) * 100, 0) / weeklyExams.length)
            : 0;

          // Pending homework count
          const { data: allHw } = await supabase.from("homework").select("id").eq("grade", student.grade);
          const { data: doneHw } = await supabase.from("homework_submissions").select("homework_id").eq("user_id", uid);
          const doneSet = new Set((doneHw || []).map((h: any) => h.homework_id));
          const pendingCount = (allHw || []).filter((h: any) => !doneSet.has(h.id)).length;

          // Build report text
          const lines = [
            `📊 التقرير الأسبوعي - ${student.full_name}`,
            `📹 فيديوهات: ${weeklyViews}`,
            `📝 واجبات: ${weeklyHw.length} (متوسط: ${hwAvg}%)`,
            `📋 امتحانات: ${weeklyExams.length} (متوسط: ${examAvg}%)`,
            `⭐ النقاط: ${totalPoints} | الترتيب: ${rank.rank}/${rank.total_students}`,
          ];
          if (pendingCount > 0) lines.push(`⚠️ واجبات متأخرة: ${pendingCount}`);

          const reportBody = lines.join("\n");

          // Save as parent notification
          await supabase.from("parent_notifications").insert({
            parent_phone: parent.phone,
            student_user_id: uid,
            title: `📊 التقرير الأسبوعي - ${student.full_name}`,
            body: reportBody,
          });

          // Notify student
          await supabase.from("student_notifications").insert({
            user_id: uid,
            title: "تم إرسال التقرير الأسبوعي",
            body: "تم إرسال تقرير أدائك الأسبوعي لولي أمرك",
            type: "report",
          });
        }

        // Send push notification to parent
        try {
          const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
          const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
          await fetch(`${SUPABASE_URL}/functions/v1/send-parent-push`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${ANON_KEY}`, apikey: ANON_KEY },
            body: JSON.stringify({
              parent_phone: parent.phone,
              title: "📊 التقرير الأسبوعي",
              body: "تقرير أداء ابنك الأسبوعي جاهز. افتح التطبيق لمراجعته.",
            }),
          });
        } catch (e) {
          console.error("Push error:", e);
        }

        sentCount++;
      } catch (err) {
        console.error(`Error for ${parent.phone}:`, err);
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
