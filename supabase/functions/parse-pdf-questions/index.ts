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

    // Verify admin
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");

    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: "غير مصرح - أدمن فقط" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const body = await req.json();
    const { pdf_url, grade, subject, lesson } = body;

    if (!pdf_url || !grade || !subject) {
      return new Response(JSON.stringify({ error: "بيانات ناقصة" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Fetch the PDF content
    const pdfResponse = await fetch(pdf_url);
    if (!pdfResponse.ok) {
      return new Response(JSON.stringify({ error: "فشل تحميل الملف" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));

    // Use Lovable AI to extract questions from PDF
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `أنت مساعد لاستخراج الأسئلة من ملفات PDF التعليمية. استخرج جميع الأسئلة من المحتوى وحولها إلى JSON.

لكل سؤال اختيار من متعدد (MCQ):
- question_text: نص السؤال
- question_type: "mcq"
- options: مصفوفة من الخيارات (4 خيارات)
- correct_answer: الإجابة الصحيحة (نص الخيار الصحيح)

لكل سؤال مقالي:
- question_text: نص السؤال
- question_type: "essay"
- options: null
- correct_answer: null

أرجع JSON array فقط بدون أي نص إضافي. مثال:
[{"question_text":"ما هو...","question_type":"mcq","options":["أ","ب","ج","د"],"correct_answer":"أ"}]`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `استخرج جميع الأسئلة من هذا الملف. المادة: ${subject}، الصف: ${grade}${lesson ? `، الدرس: ${lesson}` : ""}`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:application/pdf;base64,${pdfBase64}`
                }
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 8000,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", errText);
      return new Response(JSON.stringify({ error: "فشل تحليل الملف بالذكاء الاصطناعي" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse the JSON from AI response
    let questions: any[] = [];
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error("JSON parse error:", e, "Content:", content);
      return new Response(JSON.stringify({ error: "فشل تحليل الأسئلة من الملف", raw: content }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!questions || questions.length === 0) {
      return new Response(JSON.stringify({ error: "لم يتم العثور على أسئلة في الملف", raw: content }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Insert questions into question_bank
    const toInsert = questions.map((q: any) => ({
      grade,
      subject,
      lesson: lesson || null,
      question_text: q.question_text,
      question_type: q.question_type || "mcq",
      options: q.options || null,
      correct_answer: q.correct_answer || null,
    }));

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("question_bank")
      .insert(toInsert)
      .select("id");

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "فشل حفظ الأسئلة" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      count: inserted?.length || 0,
      questions: toInsert,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "حدث خطأ غير متوقع" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
