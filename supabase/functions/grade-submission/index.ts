import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Convert image URL to base64 data URL so AI can actually read it
async function imageUrlToBase64(url: string): Promise<string | null> {
  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      console.error("Failed to fetch image:", resp.status, url.substring(0, 100));
      return null;
    }
    const contentType = resp.headers.get("content-type") || "image/jpeg";
    const buffer = await resp.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    
    // Convert to base64 in chunks to avoid stack overflow
    let binary = "";
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
      for (let j = 0; j < chunk.length; j++) {
        binary += String.fromCharCode(chunk[j]);
      }
    }
    const base64 = btoa(binary);
    return `data:${contentType};base64,${base64}`;
  } catch (e) {
    console.error("Error converting image to base64:", e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { submission_id, type } = await req.json();
    
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

      // Get answer key URL (optional - AI can grade without it)
      const answerKeyUrl = hw.answer_key_url;

      // Check if student submitted any content at all
      const hasImages = sub.image_urls && sub.image_urls.length > 0;
      const hasText = sub.content && sub.content.trim().length > 0;
      
      if (!hasImages && !hasText) {
        // No answers at all - set score to 0 with clear feedback
        await supabaseAdmin
          .from("homework_submissions")
          .update({
            ai_score: 0,
            ai_feedback: "لم يتم تقديم أي إجابات.",
            score: 0,
            total: 10,
            feedback: "[تصحيح تلقائي] لم يتم تقديم أي إجابات.",
          })
          .eq("id", submission_id);

        return new Response(JSON.stringify({ success: true, score: 0, total: 10, feedback: "لم يتم تقديم أي إجابات." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Re-generate fresh signed URLs for student images (old ones may have expired)
      let freshImageUrls: string[] = [];
      if (hasImages) {
        for (const url of sub.image_urls) {
          // Extract the storage path from the signed URL
          // Signed URLs look like: .../storage/v1/object/sign/submissions/user_id/file.jpg?token=...
          const pathMatch = url.match(/\/submissions\/(.+?)(?:\?|$)/);
          if (pathMatch) {
            const storagePath = decodeURIComponent(pathMatch[1]);
            const { data: signedData } = await supabaseAdmin.storage
              .from("submissions")
              .createSignedUrl(storagePath, 600); // 10 min is enough
            if (signedData?.signedUrl) {
              freshImageUrls.push(signedData.signedUrl);
            }
          } else {
            // If we can't extract path, try the original URL
            freshImageUrls.push(url);
          }
        }
      }

      // Convert images to base64 so AI can actually read them
      const base64Images: string[] = [];
      for (const url of freshImageUrls) {
        const b64 = await imageUrlToBase64(url);
        if (b64) base64Images.push(b64);
      }

      console.log(`Grading submission ${submission_id}: ${base64Images.length} images converted to base64, hasText: ${hasText}`);

      // Also convert answer key to base64 if it exists
      let answerKeyBase64: string | null = null;
      if (answerKeyUrl) {
        // Answer key might also be a signed URL that expired
        const akPathMatch = answerKeyUrl.match(/\/(?:submissions|documents|receipts)\/(.+?)(?:\?|$)/);
        let akUrl = answerKeyUrl;
        if (akPathMatch) {
          // Try to regenerate
          for (const bucket of ["documents", "submissions"]) {
            const { data: akSigned } = await supabaseAdmin.storage
              .from(bucket)
              .createSignedUrl(akPathMatch[1], 600);
            if (akSigned?.signedUrl) {
              akUrl = akSigned.signedUrl;
              break;
            }
          }
        }
        answerKeyBase64 = await imageUrlToBase64(akUrl);
      }

      // Build messages for AI with base64 images
      const userContent: any[] = [];
      let contextText = `الواجب: ${hw.title}\nالمادة: ${hw.subject}\nالصف: ${hw.grade}`;
      if (hw.homework_type === "book") {
        contextText += `\nنوع: حل كتاب ${hw.book_name || ""}`;
        if (hw.page_from) contextText += ` من صفحة ${hw.page_from}`;
        if (hw.page_to) contextText += ` لصفحة ${hw.page_to}`;
        if (hw.lesson_number) contextText += ` - درس ${hw.lesson_number}`;
      }

      // Add answer key
      if (answerKeyBase64) {
        contextText += "\n\nالإجابات النموذجية (في الصورة التالية):";
        userContent.push({ type: "text", text: contextText });
        userContent.push({ type: "image_url", image_url: { url: answerKeyBase64 } });
      } else if (answerKeyUrl) {
        // Try original URL as fallback
        contextText += "\n\nالإجابات النموذجية:";
        userContent.push({ type: "text", text: contextText });
        userContent.push({ type: "image_url", image_url: { url: answerKeyUrl } });
      } else {
        userContent.push({ type: "text", text: contextText + "\n\nلا توجد إجابات نموذجية، قيّم بناءً على صحة المعلومات الدينية." });
      }

      // Add student text answer
      if (hasText) {
        userContent.push({ type: "text", text: `\n\nإجابة الطالب المكتوبة:\n${sub.content}` });
      }

      // Add student images as base64
      if (base64Images.length > 0) {
        userContent.push({ type: "text", text: `\n\nصور إجابات الطالب (${base64Images.length} صورة) - اقرأ خط اليد بعناية:` });
        for (const b64 of base64Images) {
          userContent.push({ type: "image_url", image_url: { url: b64 } });
        }
      } else if (hasImages) {
        // Images existed but couldn't convert - log error
        console.error("Could not convert any student images to base64!");
        userContent.push({ type: "text", text: "\n\nملاحظة: الطالب رفع صور لكن لم نتمكن من قراءتها." });
      }

      const messages: any[] = [
        {
          role: "system",
          content: `أنت مصحح امتحانات وواجبات إسلامية خبير جداً في قراءة خط اليد العربي بجميع أشكاله. أنت تفهم اللغة العربية فهماً عميقاً وتقبل المرادفات والتعبيرات المختلفة التي تؤدي نفس المعنى.

## مهمتك خطوة بخطوة:

### الخطوة 1: قراءة صور إجابات الطالب
- ركز على كل صورة من صور الطالب واقرأ خط اليد بعناية فائقة
- حتى لو الخط سيء جداً أو غير واضح، حاول بكل الطرق فهم ما كتبه الطالب
- انظر للحروف والكلمات في سياقها لتفهم المعنى
- إذا كانت كلمة غير واضحة، خمنها من السياق

### الخطوة 2: قراءة الإجابات النموذجية
- اقرأ الإجابات النموذجية المرفقة (صورة أو نص)
- افهم المطلوب من كل سؤال

### الخطوة 3: المقارنة بالمعنى وليس بالحرف
- قارن إجابة الطالب بالإجابة النموذجية من حيث المعنى والمضمون
- إذا كتب الطالب نفس المعنى بكلمات مختلفة أو مرادفات = إجابة صحيحة
- إذا كتب الطالب جملة تؤدي نفس المعنى حتى لو بأسلوب مختلف = إجابة صحيحة
- مثال: "التوحيد" و"عبادة الله وحده" = نفس المعنى = صحيح
- مثال: "الصلاة" و"إقامة الصلاة" = نفس المعنى = صحيح
- مثال: "أركان الإسلام خمسة" و"للإسلام خمسة أركان" = نفس المعنى = صحيح

### قواعد التصحيح:
- ✅ نفس المعنى بكلمات مختلفة = صحيح (درجة كاملة)
- ✅ إجابة صحيحة جزئياً = درجة جزئية
- ✅ خط سيء لكن يمكن فهمه = حاول واحسبه
- ❌ صفر فقط إذا: الصورة فارغة تماماً / لا يوجد أي نص / الإجابة خاطئة تماماً ولا علاقة لها بالسؤال
- ❌ لا تطلب تطابق حرفي أبداً

### الملاحظات يجب أن تشمل:
1. ما قرأته من خط يد الطالب (انسخ ما فهمته حرفياً)
2. مقارنة مختصرة مع الإجابة النموذجية
3. سبب الدرجة المعطاة

الدرجة من 0 إلى 10.

أرجع JSON فقط بدون أي نص إضافي:
{"score": رقم, "total": 10, "feedback": "ملاحظات"}`
        },
        {
          role: "user",
          content: userContent
        }
      ];

      console.log("Sending to AI for grading...");

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages,
          temperature: 0.2,
          max_tokens: 2500,
        }),
      });

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        console.error("AI error:", aiResponse.status, errText);
        return new Response(JSON.stringify({ error: "ai_error", details: errText }), {
          status: aiResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const aiData = await aiResponse.json();
      const content = aiData.choices?.[0]?.message?.content || "";
      console.log("AI response:", content);
      
      let result = { score: 0, total: 10, feedback: "لم يتمكن النظام من التصحيح" };
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) result = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error("Parse error:", e, "Raw content:", content);
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

      // Notify student if perfect score (certificate available)
      if (result.score >= result.total && result.total > 0) {
        await supabaseAdmin.from("student_notifications").insert({
          user_id: sub.user_id,
          title: "🏆 شهادة جديدة متاحة!",
          body: `مبروك! حصلت على الدرجة النهائية في واجب "${hw.title}". شهادتك جاهزة للتحميل من صفحة الشهادات.`,
          type: "certificate",
        });
      }

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
