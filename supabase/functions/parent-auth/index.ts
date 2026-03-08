import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

async function sendSMS(phone: string, message: string) {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID")!;
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN")!;
  const fromPhone = Deno.env.get("TWILIO_PHONE_NUMBER")!;

  // Format Egyptian phone to international
  let intlPhone = phone;
  if (phone.startsWith("0")) {
    intlPhone = "+2" + phone;
  } else if (!phone.startsWith("+")) {
    intlPhone = "+" + phone;
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const body = new URLSearchParams({
    To: intlPhone,
    From: fromPhone,
    Body: message,
  });

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
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { action, phone, password, full_name, otp } = await req.json();

    if (!phone) {
      return new Response(JSON.stringify({ error: "رقم الهاتف مطلوب" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const normalizedPhone = phone.trim().replace(/\s+/g, "");

    // ========== STEP 1: Send OTP to verify parent phone ==========
    if (action === "send_otp") {
      // Check if parent phone exists in any student profile
      const { data: linkedStudents } = await supabaseAdmin
        .from("profiles")
        .select("full_name, grade")
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

      // Generate 6-digit OTP
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Delete old OTPs for this phone
      await supabaseAdmin
        .from("password_reset_otps")
        .delete()
        .eq("phone", normalizedPhone + "_parent");

      // Insert OTP
      await supabaseAdmin
        .from("password_reset_otps")
        .insert({
          phone: normalizedPhone + "_parent",
          code,
          expires_at: expiresAt.toISOString(),
          attempt_count: 0,
          used: false,
        });

      // Send SMS
      try {
        await sendSMS(normalizedPhone, `كود التحقق لتسجيل ولي الأمر في منصة الأستاذ إسماعيل أحمد عبادة: ${code}\nصالح لمدة 10 دقائق.`);
      } catch {
        return new Response(JSON.stringify({ error: "فشل إرسال رسالة التحقق. حاول مرة أخرى." }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        message: "تم إرسال كود التحقق",
        students: linkedStudents.map(s => ({ full_name: s.full_name, grade: s.grade })),
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // ========== STEP 2: Verify OTP and register ==========
    if (action === "verify_and_register") {
      if (!otp || !password) {
        return new Response(JSON.stringify({ error: "كود التحقق وكلمة المرور مطلوبان" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      if (password.length < 6) {
        return new Response(JSON.stringify({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Find OTP
      const { data: otpRecord } = await supabaseAdmin
        .from("password_reset_otps")
        .select("*")
        .eq("phone", normalizedPhone + "_parent")
        .eq("used", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!otpRecord) {
        return new Response(JSON.stringify({ error: "لم يتم إرسال كود تحقق لهذا الرقم. أعد الإرسال." }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Check expiry
      if (new Date(otpRecord.expires_at) < new Date()) {
        return new Response(JSON.stringify({ error: "انتهت صلاحية الكود. أعد الإرسال." }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Check attempts
      if (otpRecord.attempt_count >= 5) {
        await supabaseAdmin
          .from("password_reset_otps")
          .update({ used: true })
          .eq("id", otpRecord.id);
        return new Response(JSON.stringify({ error: "تم تجاوز عدد المحاولات. أعد إرسال الكود." }), {
          status: 429,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Increment attempt
      await supabaseAdmin
        .from("password_reset_otps")
        .update({ attempt_count: otpRecord.attempt_count + 1 })
        .eq("id", otpRecord.id);

      // Verify code
      if (otpRecord.code !== otp.trim()) {
        return new Response(JSON.stringify({ error: "كود التحقق غير صحيح" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Mark as used
      await supabaseAdmin
        .from("password_reset_otps")
        .update({ used: true })
        .eq("id", otpRecord.id);

      // Check if already registered (race condition)
      const { data: existing } = await supabaseAdmin
        .from("parent_accounts")
        .select("id")
        .eq("phone", normalizedPhone)
        .maybeSingle();

      if (existing) {
        return new Response(JSON.stringify({ error: "هذا الرقم مسجل بالفعل." }), {
          status: 409,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Hash and create account
      const hashHex = await hashPassword(password, normalizedPhone);

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

      // Get linked students
      const { data: students } = await supabaseAdmin
        .from("profiles")
        .select("user_id, full_name, grade, is_subscribed, student_phone, school, governorate, madhab")
        .eq("parent_phone", normalizedPhone);

      // Get parent account
      const { data: parent } = await supabaseAdmin
        .from("parent_accounts")
        .select("id, phone, full_name")
        .eq("phone", normalizedPhone)
        .single();

      return new Response(JSON.stringify({
        success: true,
        message: "تم التسجيل بنجاح",
        parent,
        students: students || [],
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // ========== LOGIN ==========
    if (action === "login") {
      if (!password) {
        return new Response(JSON.stringify({ error: "كلمة المرور مطلوبة" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const hashHex = await hashPassword(password, normalizedPhone);

      const { data: parent } = await supabaseAdmin
        .from("parent_accounts")
        .select("id, phone, full_name")
        .eq("phone", normalizedPhone)
        .eq("password_hash", hashHex)
        .maybeSingle();

      if (!parent) {
        return new Response(JSON.stringify({ error: "رقم الهاتف أو كلمة المرور غير صحيحة" }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const { data: students } = await supabaseAdmin
        .from("profiles")
        .select("user_id, full_name, grade, is_subscribed, student_phone, school, governorate, madhab")
        .eq("parent_phone", normalizedPhone);

      return new Response(JSON.stringify({
        success: true,
        parent,
        students: students || [],
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // ========== GET STUDENT DATA ==========
    if (action === "get_student_data") {
      if (!password) {
        return new Response(JSON.stringify({ error: "غير مصرح" }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const hashHex = await hashPassword(password, normalizedPhone);

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

        const [
          videosRes, viewsRes, homeworkRes, hwSubsRes, examsRes, attemptsRes,
          pointsRes, rankRes, notificationsRes
        ] = await Promise.all([
          supabaseAdmin.from("videos").select("id, subject, title").eq("grade", grade),
          supabaseAdmin.from("video_views").select("video_id").eq("user_id", userId),
          supabaseAdmin.from("homework").select("id, subject, title, due_date").eq("grade", grade),
          supabaseAdmin.from("homework_submissions").select("homework_id, score, submitted_at").eq("user_id", userId),
          supabaseAdmin.from("exams").select("id, subject, title, access_type").eq("grade", grade),
          supabaseAdmin.from("exam_attempts").select("exam_id, score, total, submitted_at").eq("user_id", userId),
          supabaseAdmin.from("student_points").select("points").eq("user_id", userId),
          supabaseAdmin.rpc("get_student_rank", { p_user_id: userId }),
          supabaseAdmin.from("student_notifications").select("title, body, created_at, is_read, type").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
        ]);

        const videos = videosRes.data || [];
        const views = new Set((viewsRes.data || []).map(v => v.video_id));
        const homework = homeworkRes.data || [];
        const hwSubs = new Map((hwSubsRes.data || []).map(h => [h.homework_id, h]));
        const exams = examsRes.data || [];
        const attempts = new Map((attemptsRes.data || []).map(a => [a.exam_id, a]));

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
            videosTotal: subVideos.length, videosWatched: watchedCount,
            homeworkTotal: subHw.length, homeworkDone: hwDone,
            examsTotal: subExams.length, examsDone,
            overallPercent: total > 0 ? Math.round((done / total) * 100) : 0,
          };
        });

        const pendingHomework = homework.filter(h => !hwSubs.has(h.id)).map(h => ({ title: h.title, subject: h.subject, due_date: h.due_date }));
        const pendingExams = exams.filter(e => !attempts.has(e.id)).map(e => ({ title: e.title, subject: e.subject }));
        const examResults = exams.filter(e => attempts.has(e.id)).map(e => {
          const a = attempts.get(e.id)!;
          return { title: e.title, subject: e.subject, score: a.score, total: a.total, submitted_at: a.submitted_at };
        });
        const homeworkResults = homework.filter(h => hwSubs.has(h.id)).map(h => {
          const s = hwSubs.get(h.id)!;
          return { title: h.title, subject: h.subject, score: s.score, submitted_at: s.submitted_at };
        });

        const rank = rankRes.data?.[0] || { rank: 0, total_students: 0, total_points: 0 };
        const totalPoints = (pointsRes.data || []).reduce((sum: number, p: any) => sum + p.points, 0);

        studentDataList.push({
          profile: student,
          subjectProgress: subjectProgress.sort((a, b) => b.overallPercent - a.overallPercent),
          pendingHomework, pendingExams, examResults, homeworkResults,
          rank: { rank: rank.rank, total_students: rank.total_students, total_points: rank.total_points },
          totalPoints,
          notifications: notificationsRes.data || [],
        });
      }

      return new Response(JSON.stringify({ students: studentDataList }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err: any) {
    console.error("Parent auth error:", err?.message || err);
    return new Response(JSON.stringify({ error: "حدث خطأ غير متوقع" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
