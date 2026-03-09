import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    // Pick a random subject from available ones
    const subjectsList = subjects && subjects.length > 0 
      ? subjects 
      : ["الفقه", "التوحيد", "التفسير", "الحديث الشريف", "السيرة النبوية"];
    const randomSubject = subjectsList[Math.floor(Math.random() * subjectsList.length)];

    const systemPrompt = `أنت معلم تربية دينية إسلامية خبير. مهمتك إنشاء سؤال اختيار من متعدد صعب ودقيق للطلاب.

القواعد:
- السؤال يجب أن يكون صعباً ويختبر الفهم العميق وليس الحفظ فقط
- الخيارات يجب أن تكون 4 خيارات متقاربة لتكون صعبة
- السؤال يكون باللغة العربية الفصحى
- لا تكرر أسئلة شائعة أو سهلة
- اجعل السؤال يحتاج تفكير وتحليل
- كل مرة أنشئ سؤالاً مختلفاً تماماً وفريداً`;

    const userPrompt = `أنشئ سؤال اختيار من متعدد صعب في مادة "${randomSubject}" لطالب في الصف "${grade}".

السؤال يجب أن يكون:
- صعب ويختبر الفهم العميق
- مختلف في كل مرة (استخدم زوايا وموضوعات مختلفة)
- دقيق علمياً وشرعياً

${randomSubject === "الفقه" ? "ركز على المسائل الفقهية الدقيقة والخلافية والأحكام التفصيلية" : ""}
${randomSubject === "التوحيد" ? "ركز على العقيدة والأسماء والصفات والفرق بين المذاهب العقدية" : ""}
${randomSubject === "التفسير" ? "ركز على أسباب النزول والمعاني الدقيقة والناسخ والمنسوخ" : ""}
${randomSubject === "الحديث الشريف" ? "ركز على متون الأحاديث ورواتها ودرجاتها والأحكام المستنبطة" : ""}
${randomSubject === "السيرة النبوية" ? "ركز على التفاصيل الدقيقة للأحداث والتواريخ والشخصيات" : ""}`;

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
