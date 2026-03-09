import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { grade, subjects } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    const subjectsList = subjects && subjects.length > 0
      ? subjects
      : ["الفقه", "التوحيد", "التفسير", "الحديث الشريف", "السيرة النبوية"];
    const randomSubject = subjectsList[Math.floor(Math.random() * subjectsList.length)];
    const g = grade || "الصف الأول الإعدادي";

    // 1) Fetch existing question bank questions as content reference
    const { data: bankQuestions } = await sb
      .from("question_bank")
      .select("question_text, options, correct_answer, lesson")
      .eq("grade", g)
      .eq("subject", randomSubject)
      .eq("question_type", "mcq")
      .limit(30);

    // 2) Fetch video homework questions as content reference
    const { data: vids } = await sb
      .from("videos")
      .select("id, title")
      .eq("grade", g)
      .eq("subject", randomSubject);

    const homeworkQuestions: { question: string; options: string[]; correctAnswer: string; videoTitle: string }[] = [];
    if (vids && vids.length > 0) {
      const videoMap = new Map(vids.map((v: any) => [v.id, v.title]));
      const videoIds = vids.map((v: any) => v.id);
      const { data: homeworks } = await sb
        .from("video_homework")
        .select("questions, video_id")
        .in("video_id", videoIds);

      if (homeworks) {
        for (const hw of homeworks) {
          if (hw.questions && Array.isArray(hw.questions)) {
            for (const q of hw.questions as any[]) {
              if (q.question && q.options && q.options.length >= 2 && typeof q.correct === "number") {
                homeworkQuestions.push({
                  question: q.question,
                  options: q.options,
                  correctAnswer: q.options[q.correct],
                  videoTitle: videoMap.get(hw.video_id) || "",
                });
              }
            }
          }
        }
      }
    }

    // 3) Fetch exam questions linked to this grade/subject
    const { data: exams } = await sb
      .from("exams")
      .select("id")
      .eq("grade", g)
      .eq("subject", randomSubject);

    const examQuestionsList: { question: string; correctAnswer: string }[] = [];
    if (exams && exams.length > 0) {
      const examIds = exams.map((e: any) => e.id);
      const { data: eqs } = await sb
        .from("exam_questions")
        .select("question_text, correct_answer")
        .eq("question_type", "mcq")
        .in("exam_id", examIds)
        .limit(30);
      if (eqs) {
        for (const q of eqs as any[]) {
          if (q.question_text && q.correct_answer) {
            examQuestionsList.push({ question: q.question_text, correctAnswer: q.correct_answer });
          }
        }
      }
    }

    // Build rich content context from ACTUAL questions (not just titles)
    let contentContext = "";

    if (bankQuestions && bankQuestions.length > 0) {
      // Shuffle and pick up to 15
      const shuffled = bankQuestions.sort(() => Math.random() - 0.5).slice(0, 15);
      contentContext += "\n\nأسئلة موجودة في بنك الأسئلة لهذه المادة (استلهم منها مواضيع مشابهة لكن لا تكررها أبداً):\n";
      for (const q of shuffled) {
        contentContext += `- السؤال: ${q.question_text}`;
        if (q.lesson) contentContext += ` (درس: ${q.lesson})`;
        contentContext += ` | الإجابة الصحيحة: ${q.correct_answer}\n`;
      }
    }

    if (homeworkQuestions.length > 0) {
      const shuffled = homeworkQuestions.sort(() => Math.random() - 0.5).slice(0, 15);
      contentContext += "\n\nأسئلة من واجبات الفيديوهات (استلهم من نفس المواضيع والدروس لكن بأسئلة جديدة مختلفة):\n";
      for (const q of shuffled) {
        contentContext += `- السؤال: ${q.question}`;
        if (q.videoTitle) contentContext += ` (من درس: ${q.videoTitle})`;
        contentContext += ` | الإجابة: ${q.correctAnswer}\n`;
      }
    }

    if (!contentContext) {
      return new Response(JSON.stringify({ error: "no_content" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `أنت معلم تربية دينية إسلامية خبير. مهمتك إنشاء سؤال اختيار من متعدد جديد بناءً على نفس المواضيع والدروس التي درسها الطلاب فعلاً.

القواعد المهمة:
- ستحصل على أسئلة موجودة فعلاً من بنك الأسئلة وواجبات الفيديوهات
- أنشئ سؤالاً جديداً تماماً لكن في نفس المواضيع والدروس
- لا تكرر أي سؤال من الأسئلة الموجودة
- اسأل عن نفس المفاهيم لكن من زاوية مختلفة
- الخيارات يجب أن تكون 4 خيارات واقعية
- السؤال يكون باللغة العربية الفصحى
- لا تسأل عن مواضيع غير موجودة في الأسئلة المرجعية`;

    const userPrompt = `أنشئ سؤال اختيار من متعدد جديد في مادة "${randomSubject}" لطالب في "${g}".

هذه هي الأسئلة والمواضيع التي درسها الطالب فعلاً - أنشئ سؤالاً جديداً في نفس المواضيع:
${contentContext}

مهم جداً: السؤال الجديد يجب أن يكون مختلف عن كل الأسئلة أعلاه لكن في نفس الدروس والمواضيع.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_question",
              description: "Create a multiple choice question",
              parameters: {
                type: "object",
                properties: {
                  question_text: { type: "string", description: "نص السؤال" },
                  options: {
                    type: "array",
                    items: { type: "string" },
                    description: "4 خيارات للإجابة",
                  },
                  correct_answer: { type: "string", description: "الإجابة الصحيحة (يجب أن تكون أحد الخيارات)" },
                  subject: { type: "string", description: "المادة" },
                },
                required: ["question_text", "options", "correct_answer", "subject"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_question" } },
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
      return new Response(JSON.stringify({ error: "no_question_generated" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const questionData = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({
      question_text: questionData.question_text,
      options: questionData.options,
      correct_answer: questionData.correct_answer,
      subject: questionData.subject || randomSubject,
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
