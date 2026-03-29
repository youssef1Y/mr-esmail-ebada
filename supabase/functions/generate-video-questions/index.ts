import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getStoragePath(videoUrl: string): string | null {
  if (!videoUrl) return null;
  if (!videoUrl.includes("://")) {
    return decodeURIComponent(videoUrl.replace(/^\/+/, ""));
  }
  try {
    const url = new URL(videoUrl);
    const markers = [
      "/storage/v1/object/sign/videos/",
      "/storage/v1/object/public/videos/",
      "/storage/v1/object/videos/",
    ];
    for (const marker of markers) {
      if (url.pathname.includes(marker)) {
        const rawPath = url.pathname.split(marker)[1] || "";
        return decodeURIComponent(rawPath.replace(/^\/+/, ""));
      }
    }
  } catch { /* ignore */ }
  return null;
}

function uint8ToBase64(bytes: Uint8Array): string {
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function extractSummaryFromAi(rawText: string): string | null {
  if (!rawText) return null;
  const text = rawText.trim();
  if (text.startsWith("STATUS:NO_VIDEO")) return null;
  if (text.startsWith("STATUS:OK")) {
    return text.replace(/^STATUS:OK\s*/i, "").trim();
  }
  return null;
}

async function summarizeVideo(
  LOVABLE_API_KEY: string,
  sb: any,
  video: any
): Promise<string | null> {
  const storagePath = getStoragePath(video.video_url);
  if (!storagePath) return null;

  const { data: signedData } = await sb.storage
    .from("videos")
    .createSignedUrl(storagePath, 3600);

  if (!signedData?.signedUrl) return null;

  const analysisPrompt = `أنت محلل محتوى تعليمي خبير ومتخصص. المطلوب مشاهدة وتحليل الفيديو بالكامل بكل تفاصيله.

قواعد إلزامية صارمة:
1) شاهد الفيديو كاملاً من أوله لآخره - لا تتخطى أي جزء.
2) استمع للصوت بعناية واقرأ كل ما يظهر على الشاشة من نصوص وعناوين وشروحات.
3) لو لم تستطع تحليل الفيديو الفعلي (صوت/صورة)، اكتب فقط: STATUS:NO_VIDEO
4) لو حللت الفيديو فعلاً، ابدأ الرد بـ STATUS:OK ثم قدّم ملخصاً شاملاً ومفصلاً يتضمن:
   - اسم الدرس/الموضوع الرئيسي الذي يتم شرحه
   - عناوين فرعية واضحة لكل جزء من الشرح
   - كل المفاهيم والمصطلحات والتعريفات التي ذُكرت
   - كل الأمثلة والأدلة الشرعية (آيات قرآنية، أحاديث نبوية) التي استُشهد بها
   - كل الأحكام والقواعد الفقهية أو العقدية التي شُرحت
   - كل الخطوات والتفاصيل التي ذكرها المعلم
   - أي أسئلة أو تنبيهات مهمة ذكرها المعلم
5) الرد بالعربية وبالتفصيل الكامل - لا تختصر.`;

  const callWithVideo = async (videoPart: Record<string, unknown>) => {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: analysisPrompt },
            videoPart,
          ],
        }],
        max_tokens: 8192,
        temperature: 0.1,
      }),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    const raw = data.choices?.[0]?.message?.content || "";
    const summary = extractSummaryFromAi(raw);
    return summary && summary.length >= 80 ? summary : null;
  };

  // Try signed URL
  let summary = await callWithVideo({
    type: "video_url",
    video_url: { url: signedData.signedUrl },
  }).catch(() => null);

  if (summary) return summary;

  // Try base64
  try {
    const videoResp = await fetch(signedData.signedUrl);
    if (videoResp.ok) {
      const buf = await videoResp.arrayBuffer();
      const bytes = new Uint8Array(buf);
      if (bytes.byteLength / (1024 * 1024) <= 18) {
        const base64 = uint8ToBase64(bytes);
        const ct = videoResp.headers.get("content-type")?.split(";")[0] || "video/mp4";
        summary = await callWithVideo({
          inline_data: { mime_type: ct, data: base64 },
        }).catch(() => null);
        if (summary) return summary;
      }
    }
  } catch { /* ignore */ }

  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { video_id, question_count, save_to_bank } = await req.json();
    if (!video_id) throw new Error("video_id is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: video, error: videoErr } = await sb
      .from("videos")
      .select("id, title, subject, grade, video_url, description")
      .eq("id", video_id)
      .single();

    if (videoErr || !video) {
      return new Response(JSON.stringify({ error: "video_not_found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const count = Math.min(question_count || 10, 20);

    // Step 1: Get or create video summary
    let { data: summaryRow } = await sb
      .from("video_summaries")
      .select("summary")
      .eq("video_id", video_id)
      .single();

    if (!summaryRow?.summary) {
      console.log("No cached summary, analyzing video...");
      const newSummary = await summarizeVideo(LOVABLE_API_KEY, sb, video);
      if (newSummary) {
        await sb.from("video_summaries").upsert({
          video_id: video.id,
          summary: newSummary,
          updated_at: new Date().toISOString(),
        }, { onConflict: "video_id" });
        summaryRow = { summary: newSummary };
        console.log("Video summarized successfully");
      }
    }

    if (!summaryRow?.summary) {
      return new Response(JSON.stringify({
        error: "no_summary",
        message: "لم يتمكن الذكاء الاصطناعي من تحليل الفيديو. تأكد إن الفيديو موجود وحجمه مناسب.",
      }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 2: Generate questions from summary
    const tools = [{
      type: "function",
      function: {
        name: "create_questions",
        description: "Create MCQ questions from video content",
        parameters: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question_text: { type: "string", description: "نص السؤال" },
                  options: { type: "array", items: { type: "string" }, description: "4 خيارات" },
                  correct_answer: { type: "string", description: "الإجابة الصحيحة" },
                  lesson: { type: "string", description: "اسم الدرس" },
                },
                required: ["question_text", "options", "correct_answer", "lesson"],
                additionalProperties: false,
              },
            },
          },
          required: ["questions"],
          additionalProperties: false,
        },
      },
    }];

    const systemPrompt = `أنت معلم تربية دينية إسلامية خبير. أنشئ أسئلة اختيار من متعدد بناءً على ملخص محتوى الفيديو التعليمي.

القواعد:
- أنشئ ${count} أسئلة مبنية فقط على المعلومات الموجودة في الملخص - لا تضف معلومات خارجية
- كل سؤال له 4 خيارات واقعية ومتقاربة تجعل الطالب يفكر
- تنوع في مستوى الصعوبة (سهل، متوسط، صعب)
- تنوع في أنماط الأسئلة (تعريفات، أحكام، أدلة شرعية، أمثلة، مقارنات)
- حدد اسم الدرس/الموضوع لكل سؤال بدقة من محتوى الملخص
- لو الملخص يحتوي على آيات أو أحاديث، اسأل عنها
- لو الملخص يحتوي على أحكام فقهية أو شروط أو أركان، اسأل عنها
- الأسئلة بالعربية الفصحى
- الإجابة الصحيحة يجب أن تكون واحدة من الخيارات الأربعة بالنص تماماً`;

    const userPrompt = `بناءً على ملخص محتوى الفيديو التالي، أنشئ ${count} أسئلة اختيار من متعدد متنوعة وشاملة:

عنوان الفيديو: ${video.title}
المادة: ${video.subject}
الصف: ${video.grade}

ملخص محتوى الفيديو (مستخرج من مشاهدة الفيديو الفعلي):
${summaryRow.summary}

مهم جداً: 
- الأسئلة يجب أن تغطي أكبر قدر ممكن من المعلومات الموجودة في الملخص
- استخرج اسم الدرس الصحيح من الملخص نفسه
- لا تكرر نفس المعلومة في أكثر من سؤال`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
        tools,
        tool_choice: { type: "function", function: { name: "create_questions" } },
        max_tokens: 8192,
      }),
    });

    if (resp.status === 429) {
      return new Response(JSON.stringify({ error: "rate_limited" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (resp.status === 402) {
      return new Response(JSON.stringify({ error: "payment_required" }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let questions: any[] = [];
    if (resp.ok) {
      const aiData = await resp.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall) {
        questions = JSON.parse(toolCall.function.arguments).questions;
      }
    }

    if (!questions.length) {
      return new Response(JSON.stringify({
        error: "no_questions_generated",
        message: "لم يتمكن الذكاء الاصطناعي من توليد أسئلة. حاول مرة تانية.",
      }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 3: Save to question bank if requested
    let savedCount = 0;
    if (save_to_bank) {
      const rows = questions.map(q => ({
        video_id: video.id,
        grade: video.grade,
        subject: video.subject,
        lesson: q.lesson || video.title,
        question_text: q.question_text,
        question_type: "mcq",
        options: q.options,
        correct_answer: q.correct_answer,
      }));

      const { error: insertErr, data: inserted } = await sb
        .from("question_bank")
        .insert(rows)
        .select("id");

      if (!insertErr) savedCount = inserted?.length || 0;
      else console.error("Insert error:", insertErr);
    }

    return new Response(JSON.stringify({
      questions,
      video_title: video.title,
      subject: video.subject,
      grade: video.grade,
      saved_to_bank: save_to_bank ? savedCount : 0,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});