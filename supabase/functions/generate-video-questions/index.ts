import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { video_id, question_count } = await req.json();
    if (!video_id) throw new Error("video_id is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    // Get the video info
    const { data: video, error: videoErr } = await sb
      .from("videos")
      .select("id, title, subject, grade, description")
      .eq("id", video_id)
      .single();

    if (videoErr || !video) {
      return new Response(JSON.stringify({ error: "video_not_found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the video summary if available
    const { data: summary } = await sb
      .from("video_summaries")
      .select("summary")
      .eq("video_id", video_id)
      .single();

    // Get any existing video homework questions for this video
    const { data: homework } = await sb
      .from("video_homework")
      .select("questions")
      .eq("video_id", video_id)
      .single();

    // Get question bank questions for same grade/subject for context
    const { data: bankQuestions } = await sb
      .from("question_bank")
      .select("question_text, correct_answer, lesson")
      .eq("grade", video.grade)
      .eq("subject", video.subject)
      .eq("question_type", "mcq")
      .limit(10);

    // Build content context
    let contentContext = `عنوان الفيديو: ${video.title}\nالمادة: ${video.subject}\nالصف: ${video.grade}`;
    
    if (video.description) {
      contentContext += `\nوصف الفيديو: ${video.description}`;
    }

    if (summary?.summary) {
      contentContext += `\n\nملخص محتوى الفيديو:\n${summary.summary}`;
    }

    if (homework?.questions && Array.isArray(homework.questions) && homework.questions.length > 0) {
      contentContext += "\n\nأسئلة واجب الفيديو الموجودة (لا تكررها، استلهم منها مواضيع):\n";
      for (const q of homework.questions as any[]) {
        if (q.question) {
          contentContext += `- ${q.question}\n`;
        }
      }
    }

    if (bankQuestions && bankQuestions.length > 0) {
      contentContext += "\n\nأسئلة مشابهة من بنك الأسئلة (لا تكررها):\n";
      for (const q of bankQuestions) {
        contentContext += `- ${q.question_text}`;
        if (q.lesson) contentContext += ` (درس: ${q.lesson})`;
        contentContext += "\n";
      }
    }

    const count = Math.min(question_count || 5, 10);

    const systemPrompt = `أنت معلم تربية دينية إسلامية خبير. مهمتك إنشاء أسئلة اختيار من متعدد بناءً على محتوى فيديو تعليمي شاهده الطالب.

القواعد:
- أنشئ ${count} أسئلة اختيار من متعدد جديدة تماماً
- كل سؤال له 4 خيارات واقعية
- الأسئلة تكون مبنية على المحتوى الفعلي للفيديو وملخصه
- لا تكرر أي سؤال من الأسئلة الموجودة
- الأسئلة بالعربية الفصحى
- تنوع في مستوى الصعوبة (سهل، متوسط، صعب)
- كل سؤال يختبر فهم نقطة مختلفة من الدرس`;

    const userPrompt = `أنشئ ${count} أسئلة اختيار من متعدد بناءً على هذا الفيديو:

${contentContext}

مهم: الأسئلة يجب أن تكون مبنية فعلاً على محتوى الفيديو والملخص المذكور أعلاه.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_questions",
              description: "Create multiple choice questions based on a video",
              parameters: {
                type: "object",
                properties: {
                  questions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question_text: { type: "string", description: "نص السؤال" },
                        options: {
                          type: "array",
                          items: { type: "string" },
                          description: "4 خيارات",
                        },
                        correct_answer: { type: "string", description: "الإجابة الصحيحة" },
                      },
                      required: ["question_text", "options", "correct_answer"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["questions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_questions" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "rate_limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "payment_required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "ai_error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      return new Response(JSON.stringify({ error: "no_questions_generated" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({
      questions: result.questions,
      video_title: video.title,
      subject: video.subject,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
