import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { action, phone, password, full_name } = await req.json();

    if (!phone || !password) {
      return new Response(JSON.stringify({ error: "رقم الهاتف وكلمة المرور مطلوبان" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Normalize phone
    const normalizedPhone = phone.trim().replace(/\s+/g, "");

    if (action === "register") {
      // Check if parent phone exists in any student profile
      const { data: linkedStudents } = await supabaseAdmin
        .from("profiles")
        .select("user_id, full_name, grade")
        .eq("parent_phone", normalizedPhone);

      if (!linkedStudents || linkedStudents.length === 0) {
        return new Response(JSON.stringify({ error: "رقم الهاتف غير مسجل كولي أمر لأي طالب. تأكد أن ابنك سجل رقمك في بياناته." }), {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Check if already registered
      const { data: existing } = await supabaseAdmin
        .from("parent_accounts")
        .select("id")
        .eq("phone", normalizedPhone)
        .maybeSingle();

      if (existing) {
        return new Response(JSON.stringify({ error: "هذا الرقم مسجل بالفعل. يمكنك تسجيل الدخول." }), {
          status: 409,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Hash password using Web Crypto API
      const encoder = new TextEncoder();
      const data = encoder.encode(password + normalizedPhone);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

      const { error: insertErr } = await supabaseAdmin
        .from("parent_accounts")
        .insert({
          phone: normalizedPhone,
          password_hash: hashHex,
          full_name: full_name || "ولي أمر",
        });

      if (insertErr) {
        console.error("Insert error:", insertErr);
        return new Response(JSON.stringify({ error: "حدث خطأ أثناء التسجيل" }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: "تم التسجيل بنجاح",
        parent_phone: normalizedPhone,
        students: linkedStudents.map(s => ({ full_name: s.full_name, grade: s.grade })),
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });

    } else if (action === "login") {
      // Hash password
      const encoder = new TextEncoder();
      const data = encoder.encode(password + normalizedPhone);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

      const { data: parent, error: findErr } = await supabaseAdmin
        .from("parent_accounts")
        .select("id, phone, full_name")
        .eq("phone", normalizedPhone)
        .eq("password_hash", hashHex)
        .maybeSingle();

      if (findErr || !parent) {
        return new Response(JSON.stringify({ error: "رقم الهاتف أو كلمة المرور غير صحيحة" }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Get linked students
      const { data: students } = await supabaseAdmin
        .from("profiles")
        .select("user_id, full_name, grade, is_subscribed, student_phone, school, governorate, madhab")
        .eq("parent_phone", normalizedPhone);

      return new Response(JSON.stringify({
        success: true,
        parent: { id: parent.id, phone: parent.phone, full_name: parent.full_name },
        students: students || [],
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });

    } else if (action === "get_student_data") {
      // Verify parent first
      const encoder = new TextEncoder();
      const data = encoder.encode(password + normalizedPhone);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

      const { data: parent } = await supabaseAdmin
        .from("parent_accounts")
        .select("id")
        .eq("phone", normalizedPhone)
        .eq("password_hash", hashHex)
        .maybeSingle();

      if (!parent) {
        return new Response(JSON.stringify({ error: "غير مصرح" }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Get all students linked to this parent
      const { data: students } = await supabaseAdmin
        .from("profiles")
        .select("user_id, full_name, grade, is_subscribed, subscription_expires_at, student_phone, school, governorate, madhab")
        .eq("parent_phone", normalizedPhone);

      if (!students || students.length === 0) {
        return new Response(JSON.stringify({ students: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const studentDataList = [];

      for (const student of students) {
        const userId = student.user_id;
        const grade = student.grade;

        // Fetch all data in parallel
        const [
          videosRes, viewsRes, homeworkRes, hwSubsRes, examsRes, attemptsRes, 
          answersRes, pointsRes, rankRes, notificationsRes
        ] = await Promise.all([
          supabaseAdmin.from("videos").select("id, subject, title").eq("grade", grade),
          supabaseAdmin.from("video_views").select("video_id, viewed_at").eq("user_id", userId),
          supabaseAdmin.from("homework").select("id, subject, title, due_date").eq("grade", grade),
          supabaseAdmin.from("homework_submissions").select("homework_id, score, submitted_at").eq("user_id", userId),
          supabaseAdmin.from("exams").select("id, subject, title, access_type").eq("grade", grade),
          supabaseAdmin.from("exam_attempts").select("exam_id, score, total, submitted_at").eq("user_id", userId),
          supabaseAdmin.from("exam_answers").select("attempt_id, is_correct").in(
            "attempt_id",
            (await supabaseAdmin.from("exam_attempts").select("id").eq("user_id", userId)).data?.map(a => a.id) || []
          ),
          supabaseAdmin.from("student_points").select("points, reason, source_type, created_at").eq("user_id", userId),
          supabaseAdmin.rpc("get_student_rank", { p_user_id: userId }),
          supabaseAdmin.from("student_notifications").select("title, body, created_at, is_read, type").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
        ]);

        const videos = videosRes.data || [];
        const views = new Set((viewsRes.data || []).map(v => v.video_id));
        const homework = homeworkRes.data || [];
        const hwSubs = new Map((hwSubsRes.data || []).map(h => [h.homework_id, h]));
        const exams = examsRes.data || [];
        const attempts = new Map((attemptsRes.data || []).map(a => [a.exam_id, a]));

        // Subject progress
        const subjects = [...new Set([...videos.map(v => v.subject), ...homework.map(h => h.subject), ...exams.map(e => e.subject)])];
        const subjectProgress = subjects.map(subject => {
          const subVideos = videos.filter(v => v.subject === subject);
          const subHw = homework.filter(h => h.subject === subject);
          const subExams = exams.filter(e => e.subject === subject);
          const watchedCount = subVideos.filter(v => views.has(v.id)).length;
          const hwDone = subHw.filter(h => hwSubs.has(h.id)).length;
          const examsDone = subExams.filter(e => attempts.has(e.id)).length;
          const total = subVideos.length + subHw.length + subExams.length;
          const done = watchedCount + hwDone + examsDone;

          return {
            subject,
            videosTotal: subVideos.length,
            videosWatched: watchedCount,
            homeworkTotal: subHw.length,
            homeworkDone: hwDone,
            examsTotal: subExams.length,
            examsDone,
            overallPercent: total > 0 ? Math.round((done / total) * 100) : 0,
          };
        });

        // Pending homework
        const pendingHomework = homework
          .filter(h => !hwSubs.has(h.id))
          .map(h => ({ title: h.title, subject: h.subject, due_date: h.due_date }));

        // Pending exams
        const pendingExams = exams
          .filter(e => !attempts.has(e.id))
          .map(e => ({ title: e.title, subject: e.subject }));

        // Exam results
        const examResults = exams
          .filter(e => attempts.has(e.id))
          .map(e => {
            const attempt = attempts.get(e.id)!;
            return {
              title: e.title,
              subject: e.subject,
              score: attempt.score,
              total: attempt.total,
              submitted_at: attempt.submitted_at,
            };
          });

        // Homework results
        const homeworkResults = homework
          .filter(h => hwSubs.has(h.id))
          .map(h => {
            const sub = hwSubs.get(h.id)!;
            return {
              title: h.title,
              subject: h.subject,
              score: sub.score,
              submitted_at: sub.submitted_at,
            };
          });

        const rank = rankRes.data?.[0] || { rank: 0, total_students: 0, total_points: 0 };
        const totalPoints = (pointsRes.data || []).reduce((sum, p) => sum + p.points, 0);

        studentDataList.push({
          profile: student,
          subjectProgress: subjectProgress.sort((a, b) => b.overallPercent - a.overallPercent),
          pendingHomework,
          pendingExams,
          examResults,
          homeworkResults,
          rank: { rank: rank.rank, total_students: rank.total_students, total_points: rank.total_points },
          totalPoints,
          notifications: notificationsRes.data || [],
        });
      }

      return new Response(JSON.stringify({ students: studentDataList }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });

    } else {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
  } catch (err: any) {
    console.error("Parent auth error:", err?.message || err);
    return new Response(JSON.stringify({ error: "حدث خطأ غير متوقع" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
