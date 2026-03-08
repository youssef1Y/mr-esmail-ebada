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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "غير مصرح" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Verify user
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "غير مصرح" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const userId = user.id;
    const body = await req.json();
    const { exam_id, answers, image_urls } = body;

    // Validate exam_id is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!exam_id || typeof exam_id !== "string" || !uuidRegex.test(exam_id)) {
      return new Response(JSON.stringify({ error: "معرف الامتحان غير صالح" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate answers is a non-null object
    if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
      return new Response(JSON.stringify({ error: "بيانات الإجابات غير صالحة" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate each answer key is UUID and value is a string with max length
    for (const [key, value] of Object.entries(answers)) {
      if (!uuidRegex.test(key)) {
        return new Response(JSON.stringify({ error: "معرف سؤال غير صالح" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      if (typeof value !== "string" || (value as string).length > 5000) {
        return new Response(JSON.stringify({ error: "إجابة غير صالحة" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    // Validate image_urls if provided
    const imageUrlsMap: Record<string, string[]> = {};
    if (image_urls && typeof image_urls === "object" && !Array.isArray(image_urls)) {
      for (const [key, value] of Object.entries(image_urls)) {
        if (!uuidRegex.test(key)) continue;
        if (!Array.isArray(value) || (value as unknown[]).length > 5) {
          return new Response(JSON.stringify({ error: "عدد الصور غير صالح" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
        // Validate each URL is a string
        for (const url of value as unknown[]) {
          if (typeof url !== "string" || (url as string).length > 2000) {
            return new Response(JSON.stringify({ error: "رابط صورة غير صالح" }), {
              status: 400,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            });
          }
        }
        imageUrlsMap[key] = value as string[];
      }
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check exam access_type and enforce subscription
    const { data: exam, error: examError } = await supabaseAdmin
      .from("exams")
      .select("access_type")
      .eq("id", exam_id)
      .single();

    if (examError || !exam) {
      return new Response(JSON.stringify({ error: "الامتحان غير موجود" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (exam.access_type === "subscribers_only") {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("is_subscribed")
        .eq("user_id", userId)
        .single();
      if (!profile?.is_subscribed) {
        return new Response(JSON.stringify({ error: "غير مصرح - يتطلب اشتراك" }), {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    // Check if already taken
    const { data: existing } = await supabaseAdmin
      .from("exam_attempts")
      .select("id")
      .eq("exam_id", exam_id)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ error: "لقد أديت هذا الامتحان من قبل" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Fetch questions with correct answers (server-side only)
    const { data: questions, error: qError } = await supabaseAdmin
      .from("exam_questions")
      .select("id, question_type, correct_answer")
      .eq("exam_id", exam_id);

    if (qError || !questions) {
      return new Response(JSON.stringify({ error: "خطأ في جلب الأسئلة" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate submitted answer keys match actual question IDs
    const questionIds = new Set(questions.map(q => q.id));
    for (const key of Object.keys(answers)) {
      if (!questionIds.has(key)) {
        return new Response(JSON.stringify({ error: "سؤال غير موجود في الامتحان" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    // Grade
    let score = 0;
    const mcqCount = questions.filter(q => q.question_type === "mcq").length;
    const details: { questionId: string; correct: boolean; correctAnswer: string | null }[] = [];

    for (const q of questions) {
      const userAnswer = answers[q.id] || "";
      if (q.question_type === "mcq") {
        const isCorrect = userAnswer === q.correct_answer;
        if (isCorrect) score++;
        details.push({ questionId: q.id, correct: isCorrect, correctAnswer: q.correct_answer });
      } else {
        details.push({ questionId: q.id, correct: false, correctAnswer: null });
      }
    }

    // Insert attempt
    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from("exam_attempts")
      .insert({ exam_id, user_id: userId, score, total: mcqCount })
      .select("id")
      .single();

    if (attemptError) {
      return new Response(JSON.stringify({ error: "حدث خطأ أثناء حفظ النتيجة" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Insert answers with validated image_urls
    const answersToInsert = questions.map(q => ({
      attempt_id: attempt.id,
      question_id: q.id,
      answer: answers[q.id] || "",
      is_correct: q.question_type === "mcq" ? answers[q.id] === q.correct_answer : false,
      image_urls: imageUrlsMap[q.id] || [],
    }));

    await supabaseAdmin.from("exam_answers").insert(answersToInsert);

    // Award points server-side
    const pointsAwarded = Math.max(2, Math.round((score / (mcqCount || 1)) * 10));
    await supabaseAdmin.from("student_points").insert({
      user_id: userId,
      points: pointsAwarded,
      reason: `امتحان`,
      source_type: "exam",
      source_id: exam_id,
    });

    return new Response(JSON.stringify({ success: true, score, total: mcqCount, details }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "حدث خطأ غير متوقع" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
