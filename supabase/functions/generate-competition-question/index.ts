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

    // Fetch video titles and descriptions for context
    const { data: videos } = await sb
      .from("videos")
      .select("title, description")
      .eq("grade", g)
      .eq("subject", randomSubject)
      .limit(30);

    // Fetch video homework questions for context
    const { data: vids } = await sb
      .from("videos")
      .select("id")
      .eq("grade", g)
      .eq("subject", randomSubject);

    let homeworkContext: string[] = [];
    if (vids && vids.length > 0) {
      const videoIds = vids.map((v: any) => v.id);
      const { data: homeworks } = await sb
        .from("video_homework")
        .select("questions")
        .in("video_id", videoIds);

      if (homeworks) {
        for (const hw of homeworks) {
          if (hw.questions && Array.isArray(hw.questions)) {
            for (const q of hw.questions as any[]) {
              if (q.question) homeworkContext.push(q.question);
            }
          }
        }
      }
    }

    const videoTitles = videos?.map((v: any) => v.title).filter(Boolean) || [];
    const videoDescriptions = videos?.map((v: any) => v.description).filter(Boolean) || [];

    let contentContext = "";
    if (videoTitles.length > 0) {
      contentContext += `\n\nعناوين الدروس المتاحة للطلاب في هذه المادة:\n${videoTitles.map((t: string, i: number) => `${i + 1}. ${t}`).join("\n")}`;
    }
    if (videoDescriptions.length > 0) {
      contentContext += `\n\nوصف بعض الدروس:\n${videoDescriptions.slice(0, 10).join("\n")}`;
    }
    if (homeworkContext.length > 0) {
      contentContext += `\n\nأمثلة على أسئلة سابقة في هذه المادة (لا تكررها بل استلهم منها):\n${homeworkContext.slice(0, 15).join("\n")}`;
    }

    if (!contentContext) {
      return new Response(JSON.stringify({ error: "no_content" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `أنت معلم تربية دينية إسلامية خبير. مهمتك إنشاء سؤال اختيار من متعدد بناءً على محتوى الدروس الفعلية التي درسها الطلاب.

القواعد:
- السؤال يجب أن يكون مبنياً على محتوى الدروس والفيديوهات المتاحة فقط
- لا تسأل عن مواضيع لم يدرسها الطالب
- الخيارات يجب أن تكون 4 خيارات
- السؤال يكون باللغة العربية الفصحى
- اجعل السؤال يختبر الفهم وليس الحفظ فقط
- كل مرة أنشئ سؤالاً مختلفاً`;

    const userPrompt = `أنشئ سؤال اختيار من متعدد في مادة "${randomSubject}" لطالب في "${g}".

السؤال يجب أن يكون مبنياً على المحتوى التالي الذي درسه الطالب:
${contentContext}

أنشئ سؤالاً جديداً مستوحى من هذه الدروس والمواضيع.`;

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
