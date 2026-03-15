import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import bcrypt from "npm:bcryptjs@2.4.3";

const bcryptHash = async (password: string): Promise<string> => {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
};
const bcryptCompare = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compareSync(password, hash);
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Legacy SHA-256 hash for migration
async function sha256Hash(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function createSession(supabaseAdmin: any, parentId: string): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Clean up expired sessions for this parent
  await supabaseAdmin
    .from("parent_sessions")
    .delete()
    .eq("parent_id", parentId)
    .lt("expires_at", new Date().toISOString());

  await supabaseAdmin
    .from("parent_sessions")
    .insert({ parent_id: parentId, token, expires_at: expiresAt.toISOString() });

  return token;
}

async function validateSession(supabaseAdmin: any, token: string): Promise<{ parentId: string; phone: string } | null> {
  const { data } = await supabaseAdmin
    .from("parent_sessions")
    .select("parent_id, expires_at")
    .eq("token", token)
    .single();

  if (!data || new Date(data.expires_at) < new Date()) return null;

  const { data: parent } = await supabaseAdmin
    .from("parent_accounts")
    .select("id, phone")
    .eq("id", data.parent_id)
    .single();

  if (!parent) return null;
  return { parentId: parent.id, phone: parent.phone };
}

async function verifyPassword(password: string, storedHash: string, phone: string, hashVersion: number): Promise<boolean> {
  if (hashVersion === 2) {
    return await bcryptCompare(password, storedHash);
  }
  // Legacy SHA-256
  const sha256 = await sha256Hash(password, phone);
  return sha256 === storedHash;
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

    const { action, phone, password, full_name, session_token } = await req.json();

    if (!phone && action !== "get_student_data") {
      return new Response(JSON.stringify({ error: "رقم الهاتف مطلوب" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const normalizedPhone = phone ? phone.trim().replace(/\s+/g, "") : "";

    // ========== REGISTER (direct — no OTP) ==========
    if (action === "register") {
      if (!password || password.length < 6) {
        return new Response(JSON.stringify({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Check if phone is registered as parent_phone for any student
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

      // Create account with bcrypt
      const passwordHash = await bcryptHash(password);

      const { data: newParent, error: insertErr } = await supabaseAdmin
        .from("parent_accounts")
        .insert({
          phone: normalizedPhone,
          password_hash: passwordHash,
          full_name: full_name || "ولي أمر",
          hash_version: 2,
        })
        .select("id, phone, full_name")
        .single();

      if (insertErr) {
        console.error("Insert error:", insertErr);
        const friendlyError = insertErr.code === "23505"
          ? "هذا الرقم مسجل بالفعل. يمكنك تسجيل الدخول مباشرة."
          : "تعذر إنشاء حساب ولي الأمر الآن. حاول مرة أخرى بعد قليل.";

        return new Response(JSON.stringify({ error: friendlyError }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const { data: students } = await supabaseAdmin
        .from("profiles")
        .select("user_id, full_name, grade, is_subscribed, student_phone, school, governorate, madhab")
        .eq("parent_phone", normalizedPhone);

      const token = await createSession(supabaseAdmin, newParent.id);

      return new Response(JSON.stringify({
        success: true,
        message: "تم التسجيل بنجاح",
        parent: { id: newParent.id, phone: newParent.phone, full_name: newParent.full_name },
        students: students || [],
        session_token: token,
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

      const { data: parent } = await supabaseAdmin
        .from("parent_accounts")
        .select("id, phone, full_name, password_hash, hash_version")
        .eq("phone", normalizedPhone)
        .maybeSingle();

      if (!parent) {
        return new Response(JSON.stringify({ error: "هذا الرقم غير مسجل كولي أمر. أنشئ حساب جديد أولاً.", error_type: "not_registered" }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const valid = await verifyPassword(password, parent.password_hash, normalizedPhone, parent.hash_version || 1);
      if (!valid) {
        return new Response(JSON.stringify({ error: "كلمة المرور غير صحيحة. تأكد من كلمة المرور وحاول مرة أخرى.", error_type: "wrong_password" }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Migrate from SHA-256 to bcrypt on successful login
      if ((parent.hash_version || 1) === 1) {
        const newHash = await bcryptHash(password);
        await supabaseAdmin
          .from("parent_accounts")
          .update({ password_hash: newHash, hash_version: 2 })
          .eq("id", parent.id);
      }

      const { data: students } = await supabaseAdmin
        .from("profiles")
        .select("user_id, full_name, grade, is_subscribed, student_phone, school, governorate, madhab")
        .eq("parent_phone", normalizedPhone);

      const token = await createSession(supabaseAdmin, parent.id);

      return new Response(JSON.stringify({
        success: true,
        parent: { id: parent.id, phone: parent.phone, full_name: parent.full_name },
        students: students || [],
        session_token: token,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // ========== GET STUDENT DATA ==========
    if (action === "get_student_data") {
      let parentPhone: string | null = null;

      if (session_token) {
        const session = await validateSession(supabaseAdmin, session_token);
        if (!session) {
          return new Response(JSON.stringify({ error: "غير مصرح" }), {
            status: 401,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
        parentPhone = session.phone;
      } else if (password && normalizedPhone) {
        const { data: parent } = await supabaseAdmin
          .from("parent_accounts")
          .select("id, phone, password_hash, hash_version")
          .eq("phone", normalizedPhone)
          .maybeSingle();

        if (!parent || !(await verifyPassword(password, parent.password_hash, normalizedPhone, parent.hash_version || 1))) {
          return new Response(JSON.stringify({ error: "غير مصرح" }), {
            status: 401,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
        parentPhone = parent.phone;
      } else {
        return new Response(JSON.stringify({ error: "غير مصرح" }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const { data: students } = await supabaseAdmin
        .from("profiles")
        .select("user_id, full_name, grade, is_subscribed, subscription_expires_at, student_phone, school, governorate, madhab")
        .eq("parent_phone", parentPhone);

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

        // Calculate week boundaries for weekly data
        const now = new Date();
        const weekBoundaries: string[] = [];
        for (let i = 0; i < 8; i++) {
          const d = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
          weekBoundaries.push(d.toISOString());
        }

        const [
          videosRes, viewsRes, homeworkRes, hwSubsRes, examsRes, attemptsRes,
          pointsRes, rankRes, notificationsRes, parentNotificationsRes,
          allViewsRes, classAttemptsRes
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
          supabaseAdmin.from("parent_notifications").select("id, title, body, created_at, is_read").eq("parent_phone", parentPhone).eq("student_user_id", userId).order("created_at", { ascending: false }).limit(30),
          // All views with timestamps for weekly chart
          supabaseAdmin.from("video_views").select("video_id, viewed_at").eq("user_id", userId).gte("viewed_at", weekBoundaries[7]).order("viewed_at", { ascending: true }),
          // Class average: all exam attempts for this grade (last 50 students)
          supabaseAdmin.from("exam_attempts").select("user_id, score, total, exam_id").in("exam_id", []),
        ]);

        const videos = videosRes.data || [];
        const views = new Set((viewsRes.data || []).map((v: any) => v.video_id));
        const homework = homeworkRes.data || [];
        const hwSubs = new Map((hwSubsRes.data || []).map((h: any) => [h.homework_id, h]));
        const exams = examsRes.data || [];
        const attempts = new Map((attemptsRes.data || []).map((a: any) => [a.exam_id, a]));

        // Derive unique subjects from actual data
        const allSubjects = new Set([
          ...videos.map((v: any) => v.subject),
          ...homework.map((h: any) => h.subject),
          ...exams.map((e: any) => e.subject),
        ]);
        const subjectProgress = Array.from(allSubjects).map(subject => {
          const subVideos = videos.filter((v: any) => v.subject === subject);
          const subHw = homework.filter((h: any) => h.subject === subject);
          const subExams = exams.filter((e: any) => e.subject === subject);
          const watchedCount = subVideos.filter((v: any) => views.has(v.id)).length;
          const hwDone = subHw.filter((h: any) => hwSubs.has(h.id)).length;
          const examsDone = subExams.filter((e: any) => attempts.has(e.id)).length;
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

        const totalPoints = (pointsRes.data || []).reduce((s: number, p: any) => s + p.points, 0);
        const rankData = rankRes.data?.[0] || { rank: 0, total_students: 0, total_points: 0 };

        // === Weekly progress data (last 8 weeks) ===
        const allViews = allViewsRes.data || [];
        const allHwSubs = hwSubsRes.data || [];
        const allExamAttempts = attemptsRes.data || [];
        
        const weeklyProgress = [];
        for (let i = 7; i >= 1; i--) {
          const weekStart = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
          const weekEnd = new Date(now.getTime() - (i - 1) * 7 * 24 * 60 * 60 * 1000);
          const wStartISO = weekStart.toISOString();
          const wEndISO = weekEnd.toISOString();
          
          const weekViews = allViews.filter((v: any) => v.viewed_at >= wStartISO && v.viewed_at < wEndISO).length;
          const weekHw = allHwSubs.filter((h: any) => h.submitted_at >= wStartISO && h.submitted_at < wEndISO);
          const weekExams = allExamAttempts.filter((e: any) => e.submitted_at >= wStartISO && e.submitted_at < wEndISO);
          
          const hwAvg = weekHw.length > 0 
            ? Math.round(weekHw.reduce((s: number, h: any) => s + ((h.score || 0) / Math.max(h.total || 1, 1)) * 100, 0) / weekHw.length) 
            : null;
          const examAvg = weekExams.length > 0 
            ? Math.round(weekExams.reduce((s: number, e: any) => s + ((e.score || 0) / Math.max(e.total || 1, 1)) * 100, 0) / weekExams.length) 
            : null;
          
          const weekLabel = `${weekStart.getDate()}/${weekStart.getMonth() + 1}`;
          weeklyProgress.push({ week: weekLabel, videos: weekViews, hwAvg, examAvg });
        }

        // === Class average for comparison ===
        // Get all students in same grade exam results
        const examIds = exams.map((e: any) => e.id);
        let classAvgExam = 0;
        let classAvgHw = 0;
        if (examIds.length > 0) {
          const { data: classExams } = await supabaseAdmin
            .from("exam_attempts")
            .select("user_id, score, total")
            .in("exam_id", examIds)
            .limit(500);
          
          if (classExams && classExams.length > 0) {
            classAvgExam = Math.round(
              classExams.reduce((s: number, e: any) => s + ((e.score || 0) / Math.max(e.total || 1, 1)) * 100, 0) / classExams.length
            );
          }
        }
        
        // Class average homework
        const hwIds = homework.map((h: any) => h.id);
        if (hwIds.length > 0) {
          const { data: classHw } = await supabaseAdmin
            .from("homework_submissions")
            .select("score")
            .in("homework_id", hwIds)
            .not("score", "is", null)
            .limit(500);
          
          if (classHw && classHw.length > 0) {
            classAvgHw = Math.round(
              classHw.reduce((s: number, h: any) => s + (h.score || 0), 0) / classHw.length
            );
          }
        }

        // Student's own averages
        const studentExamAvg = examResults.length > 0 
          ? Math.round(examResults.reduce((s: number, e: any) => s + ((e.score || 0) / Math.max(e.total || 1, 1)) * 100, 0) / examResults.length) 
          : 0;
        const scoredHw = homeworkResults.filter((h: any) => h.score !== null);
        const studentHwAvg = scoredHw.length > 0 
          ? Math.round(scoredHw.reduce((s: number, h: any) => s + (h.score || 0), 0) / scoredHw.length) 
          : 0;

        // Video watch percentage
        const totalVideos = videos.length;
        const watchedCount = views.size;
        const videoWatchPercent = totalVideos > 0 ? Math.round((watchedCount / totalVideos) * 100) : 0;

        // Pending items as arrays
        const pendingHomework = homework.filter((h: any) => !hwSubs.has(h.id)).map((h: any) => ({
          title: h.title, subject: h.subject, due_date: h.due_date,
        }));
        const pendingExams = exams.filter((e: any) => !attempts.has(e.id)).map((e: any) => ({
          title: e.title, subject: e.subject,
        }));

        // Exam results (only submitted)
        const examResults2 = exams
          .filter((e: any) => attempts.has(e.id))
          .map((e: any) => {
            const att = attempts.get(e.id);
            return { title: e.title, subject: e.subject, score: att.score, total: att.total, submitted_at: att.submitted_at };
          });

        // Homework results (only submitted)
        const homeworkResults2 = homework
          .filter((h: any) => hwSubs.has(h.id))
          .map((h: any) => {
            const sub = hwSubs.get(h.id);
            return { title: h.title, subject: h.subject, score: sub.score, submitted_at: sub.submitted_at };
          });

        studentDataList.push({
          profile: {
            user_id: student.user_id,
            full_name: student.full_name,
            grade: student.grade,
            is_subscribed: student.is_subscribed,
            subscription_expires_at: student.subscription_expires_at,
            student_phone: student.student_phone,
            school: student.school,
            governorate: student.governorate,
            madhab: student.madhab,
          },
          subjectProgress,
          pendingHomework,
          pendingExams,
          examResults: examResults2,
          homeworkResults: homeworkResults2,
          rank: { rank: rankData.rank || 0, total_students: rankData.total_students || 0, total_points: rankData.total_points || totalPoints },
          totalPoints,
          weeklyProgress,
          classComparison: {
            studentExamAvg,
            classExamAvg: classAvgExam,
            studentHwAvg,
            classHwAvg: classAvgHw,
            videoWatchPercent,
          },
          notifications: notificationsRes.data || [],
          parentMessages: parentNotificationsRes.data || [],
        });
      }

      return new Response(JSON.stringify({ students: studentDataList }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // ========== LOGOUT ==========
    if (action === "logout") {
      if (session_token) {
        await supabaseAdmin
          .from("parent_sessions")
          .delete()
          .eq("token", session_token);
      }
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ error: "إجراء غير معروف" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err: any) {
    console.error("Parent auth error:", err?.message || err);
    return new Response(JSON.stringify({ error: "تعذر تنفيذ الطلب الآن. حاول مرة أخرى بعد قليل." }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
