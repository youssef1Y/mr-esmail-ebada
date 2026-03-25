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

      // ===== PASS 1: OCR — Extract handwritten text from student images =====
      let extractedStudentText = "";
      if (base64Images.length > 0) {
        const ocrContent: any[] = [
          { type: "text", text: `أنت خبير في قراءة خط اليد العربي (OCR). مهمتك الوحيدة هي قراءة ونسخ كل ما هو مكتوب في الصور التالية بدقة عالية.

## تعليمات القراءة:
1. اقرأ كل صورة من اليمين لليسار، من أعلى لأسفل
2. انسخ كل كلمة وكل جملة كما هي مكتوبة
3. إذا كانت كلمة غير واضحة تماماً، خمنها من السياق واكتبها مع علامة [؟] بعدها
4. حافظ على ترتيب الأسئلة والأرقام كما تظهر
5. اكتب أرقام الأسئلة إذا ظهرت (مثل: 1- أو س1 أو أولاً)
6. لا تصحح الأخطاء الإملائية - انسخ كما هو مكتوب
7. إذا وجدت رسومات أو أشكال، صِفها بين [أقواس]
8. افصل بين إجابة كل سؤال بسطر فارغ

## مهم جداً:
- ركز على فهم الحروف المتصلة في خط اليد العربي
- انتبه للنقاط (ب، ت، ث، ن، ي) والتشكيل إذا وُجد
- الكلمات في سياق ديني/شرعي (فقه، توحيد، تفسير، حديث)
- إذا كان الخط صعباً جداً، حاول أكثر من محاولة للقراءة

أخرج النص المستخرج فقط بدون أي تعليقات إضافية.` }
        ];

        for (const b64 of base64Images) {
          ocrContent.push({ type: "image_url", image_url: { url: b64 } });
        }

        console.log("Pass 1: OCR extraction...");
        const ocrResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-pro",
            messages: [{ role: "user", content: ocrContent }],
            temperature: 0.1,
            max_tokens: 4000,
          }),
        });

        if (ocrResponse.ok) {
          const ocrData = await ocrResponse.json();
          extractedStudentText = ocrData.choices?.[0]?.message?.content || "";
          console.log("OCR extracted text length:", extractedStudentText.length);
          console.log("OCR preview:", extractedStudentText.substring(0, 300));
        } else {
          const errText = await ocrResponse.text();
          console.error("OCR pass failed:", ocrResponse.status, errText);
        }
      }

      // Also extract text from answer key image if exists
      let extractedAnswerKeyText = "";
      if (answerKeyBase64) {
        console.log("Extracting answer key text...");
        const akOcrResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{
              role: "user",
              content: [
                { type: "text", text: "اقرأ وانسخ كل النص المكتوب في هذه الصورة بدقة. هذه إجابات نموذجية لواجب في العلوم الشرعية. انسخ النص فقط بدون تعليقات." },
                { type: "image_url", image_url: { url: answerKeyBase64 } }
              ]
            }],
            temperature: 0.1,
            max_tokens: 3000,
          }),
        });

        if (akOcrResponse.ok) {
          const akData = await akOcrResponse.json();
          extractedAnswerKeyText = akData.choices?.[0]?.message?.content || "";
          console.log("Answer key text extracted, length:", extractedAnswerKeyText.length);
        } else {
          await akOcrResponse.text();
        }
      }

      // ===== PASS 2: Grading — Compare extracted texts =====
      let contextText = `## معلومات الواجب:\n- العنوان: ${hw.title}\n- المادة: ${hw.subject}\n- الصف: ${hw.grade}`;
      if (hw.homework_type === "book") {
        contextText += `\n- نوع: حل كتاب ${hw.book_name || ""}`;
        if (hw.page_from) contextText += ` من صفحة ${hw.page_from}`;
        if (hw.page_to) contextText += ` لصفحة ${hw.page_to}`;
        if (hw.lesson_number) contextText += ` - درس ${hw.lesson_number}`;
      }

      // Build grading prompt with extracted texts
      let gradingPrompt = contextText + "\n\n";

      if (extractedAnswerKeyText) {
        gradingPrompt += `## الإجابات النموذجية:\n${extractedAnswerKeyText}\n\n`;
      } else if (answerKeyUrl && !answerKeyBase64) {
        gradingPrompt += `## ملاحظة: لا توجد إجابات نموذجية متاحة، قيّم بناءً على صحة المعلومات الشرعية.\n\n`;
      } else if (!answerKeyUrl) {
        gradingPrompt += `## ملاحظة: لا توجد إجابات نموذجية، قيّم بناءً على صحة المعلومات الدينية والشرعية.\n\n`;
      }

      gradingPrompt += `## إجابة الطالب:\n`;
      if (extractedStudentText) {
        gradingPrompt += `### النص المستخرج من صور خط اليد:\n${extractedStudentText}\n`;
      }
      if (hasText) {
        gradingPrompt += `### إجابة مكتوبة:\n${sub.content}\n`;
      }
      if (!extractedStudentText && !hasText) {
        gradingPrompt += `لم يتم العثور على أي نص في إجابة الطالب.\n`;
      }

      const gradingMessages: any[] = [
        {
          role: "system",
          content: `أنت مصحح امتحانات وواجبات العلوم الشرعية. لديك خبرة عميقة في الفقه والتوحيد والتفسير والحديث والسيرة النبوية.

## منهجية التصحيح:

### المقارنة بالمعنى (أهم قاعدة):
- قارن إجابة الطالب بالإجابة النموذجية من حيث **المعنى والمضمون** وليس التطابق الحرفي
- اقبل المرادفات: "التوحيد" = "عبادة الله وحده" = "إفراد الله بالعبادة"
- اقبل إعادة الصياغة: "أركان الإسلام خمسة" = "للإسلام خمس أركان"
- اقبل الإجابات الصحيحة حتى لو بأسلوب مختلف عن النموذجي

### قواعد الدرجات:
- ✅ إجابة صحيحة المعنى = درجة كاملة
- ✅ إجابة صحيحة جزئياً (ذكر بعض النقاط) = درجة جزئية متناسبة
- ✅ أخطاء إملائية لا تؤثر على صحة الإجابة = لا تخصم
- ❌ صفر فقط إذا: لا يوجد أي إجابة / الإجابة خاطئة تماماً ولا علاقة لها بالسؤال
- ❌ لا تطلب تطابق حرفي أبداً

### الملاحظات يجب أن تشمل:
1. ملخص ما كتبه الطالب في كل سؤال
2. هل الإجابة صحيحة/جزئية/خاطئة ولماذا
3. الدرجة النهائية وسببها

الدرجة من 0 إلى 10.

أرجع JSON فقط:
{"score": رقم, "total": 10, "feedback": "ملاحظات مفصلة"}`
        },
        {
          role: "user",
          content: gradingPrompt
        }
      ];

      // If we have images AND extracted text, also attach images to grading for cross-reference
      if (base64Images.length > 0 && extractedStudentText) {
        const userContentWithImages: any[] = [
          { type: "text", text: gradingPrompt + "\n\n(الصور الأصلية مرفقة للتحقق من القراءة)" }
        ];
        for (const b64 of base64Images) {
          userContentWithImages.push({ type: "image_url", image_url: { url: b64 } });
        }
        // Also attach answer key image for cross-reference
        if (answerKeyBase64) {
          userContentWithImages.push({ type: "text", text: "\n\nصورة الإجابات النموذجية:" });
          userContentWithImages.push({ type: "image_url", image_url: { url: answerKeyBase64 } });
        }
        gradingMessages[1] = { role: "user", content: userContentWithImages };
      }

      console.log("Pass 2: Grading...");

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages: gradingMessages,
          temperature: 0.15,
          max_tokens: 3000,
        }),
      });

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        console.error("AI grading error:", aiResponse.status, errText);
        return new Response(JSON.stringify({ error: "ai_error", details: errText }), {
          status: aiResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const aiData = await aiResponse.json();
      const content = aiData.choices?.[0]?.message?.content || "";
      console.log("Grading response:", content.substring(0, 500));
      
      let result = { score: 0, total: 10, feedback: "لم يتمكن النظام من التصحيح" };
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) result = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error("Parse error:", e, "Raw content:", content);
      }

      // Update submission with AI grading + extracted text for debugging
      const feedbackWithOcr = extractedStudentText 
        ? `[تصحيح تلقائي]\n${result.feedback}\n\n📝 ما قرأه النظام من خط اليد:\n${extractedStudentText.substring(0, 500)}`
        : `[تصحيح تلقائي] ${result.feedback}`;

      await supabaseAdmin
        .from("homework_submissions")
        .update({
          ai_score: result.score,
          ai_feedback: result.feedback,
          score: result.score,
          total: result.total,
          feedback: feedbackWithOcr,
        })
        .eq("id", submission_id);

      // Notify student if perfect score
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
