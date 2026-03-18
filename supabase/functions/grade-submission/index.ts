import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { submission_id, type } = await req.json();
    // type: "homework" or "exam"
    
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    if (type === "homework") {
      // Get submission with images
      const { data: sub } = await supabaseAdmin
        .from("homework_submissions")
        .select("*")
        .eq("id", submission_id)
        .single();
      if (!sub) throw new Error("Submission not found");

      // Get homework details
      const { data: hw } = await supabaseAdmin
        .from("homework")
        .select("*")
        .eq("id", sub.homework_id)
        .single();
      if (!hw) throw new Error("Homework not found");

      // Get answer key URL
      const answerKeyUrl = hw.answer_key_url;
      if (!answerKeyUrl && !hw.pdf_url) {
        return new Response(JSON.stringify({ error: "no_answer_key" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Build messages for AI
      const messages: any[] = [
        {
          role: "system",
          content: `أنت مصحح امتحانات وواجبات تربية دينية إسلامية. مهمتك مقارنة إجابات الطالب بالإجابات النموذجية وتقييمها.

القواعد:
- افهم خط اليد العربي حتى لو كان غير واضح بعض الشيء
- قارن إجابة الطالب بالإجابة النموذجية من حيث المعنى وليس النص الحرفي
- أعط درجة من 0 إلى 10
- اكتب ملاحظات مختصرة للطالب
- إذا كانت الإجابة فارغة أو غير مقروءة أعط 0

أرجع JSON فقط بالشكل:
{"score": رقم, "total": 10, "feedback": "ملاحظات مختصرة"}`
        },
        {
          role: "user",
          content: [] as any[]
        }
      ];

      // Add context about the homework
      const userContent: any[] = [];
      let contextText = `الواجب: ${hw.title}\nالمادة: ${hw.subject}\nالصف: ${hw.grade}`;
      if (hw.homework_type === "book") {
        contextText += `\nنوع: حل كتاب ${hw.book_name || ""}`;
        if (hw.page_from) contextText += ` من صفحة ${hw.page_from}`;
        if (hw.page_to) contextText += ` لصفحة ${hw.page_to}`;
        if (hw.lesson_number) contextText += ` - درس ${hw.lesson_number}`;
      }

      // Add answer key
      if (answerKeyUrl) {
        contextText += "\n\nهذه هي الإجابات النموذجية:";
        userContent.push({ type: "text", text: contextText });
        userContent.push({ type: "image_url", image_url: { url: answerKeyUrl } });
      } else {
        userContent.push({ type: "text", text: contextText + "\n\nلا توجد إجابات نموذجية، قيّم بناءً على صحة المعلومات الدينية." });
      }

      // Add student answer text
      if (sub.content) {
        userContent.push({ type: "text", text: `\n\nإجابة الطالب المكتوبة:\n${sub.content}` });
      }

      // Add student images
      if (sub.image_urls && sub.image_urls.length > 0) {
        userContent.push({ type: "text", text: "\n\nصور إجابات الطالب:" });
        for (const url of sub.image_urls) {
          userContent.push({ type: "image_url", image_url: { url } });
        }
      }

      messages[1].content = userContent;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages,
          temperature: 0.1,
          max_tokens: 1000,
        }),
      });

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        console.error("AI error:", errText);
        return new Response(JSON.stringify({ error: "ai_error" }), {
          status: aiResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const aiData = await aiResponse.json();
      const content = aiData.choices?.[0]?.message?.content || "";
      
      let result = { score: 0, total: 10, feedback: "لم يتمكن النظام من التصحيح" };
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) result = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error("Parse error:", e);
      }

      // Update submission with AI grading
      await supabaseAdmin
        .from("homework_submissions")
        .update({
          ai_score: result.score,
          ai_feedback: result.feedback,
          score: result.score,
          total: result.total,
          feedback: `[تصحيح تلقائي] ${result.feedback}`,
        })
        .eq("id", submission_id);

      return new Response(JSON.stringify({ success: true, ...result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "unsupported_type" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
