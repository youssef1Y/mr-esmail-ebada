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
    const { exam_id, answers, image_urls } = await req.json();

    if (!exam_id || !answers || typeof answers !== "object") {
      return new Response(JSON.stringify({ error: "بيانات غير صالحة" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

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
      return new Response(JSON.stringify({ error: attemptError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Insert answers with image_urls
    const imageUrlsMap = image_urls || {};
    const answersToInsert = questions.map(q => ({
      attempt_id: attempt.id,
      question_id: q.id,
      answer: answers[q.id] || "",
      is_correct: q.question_type === "mcq" ? answers[q.id] === q.correct_answer : false,
      image_urls: imageUrlsMap[q.id] || [],
    }));

    await supabaseAdmin.from("exam_answers").insert(answersToInsert);

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
