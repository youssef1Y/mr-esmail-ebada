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

async function callAIWithVideo(
  LOVABLE_API_KEY: string,
  systemPrompt: string,
  userPrompt: string,
  videoPart: Record<string, unknown>,
  tools: any[],
  toolChoice: any
) {
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
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            videoPart,
          ],
        },
      ],
      tools,
      tool_choice: toolChoice,
      max_tokens: 8192,
    }),
  });

  return response;
}

async function callAIWithSummary(
  LOVABLE_API_KEY: string,
  systemPrompt: string,
  userPrompt: string,
  tools: any[],
  toolChoice: any
) {
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
      tools,
      tool_choice: toolChoice,
      max_tokens: 8192,
    }),
  });

  return response;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { video_id, question_count, save_to_bank } = await req.json();
    if (!video_id) throw new Error("video_id is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    // Get video info
    const { data: video, error: videoErr } = await sb
      .from("videos")
      .select("id, title, subject, grade, video_url, description")
      .eq("id", video_id)
      .single();

    if (videoErr || !video) {
      return new Response(JSON.stringify({ error: "video_not_found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const count = Math.min(question_count || 5, 10);

    const tools = [
      {
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
                    correct_answer: { type: "string", description: "الإجابة الصحيحة (من الخيارات)" },
                    lesson: { type: "string", description: "اسم الدرس أو الموضوع" },
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
      },
    ];
    const toolChoice = { type: "function", function: { name: "create_questions" } };

    const systemPrompt = `أنت معلم تربية دينية إسلامية خبير. مهمتك مشاهدة وتحليل محتوى الفيديو التعليمي وإنشاء أسئلة اختيار من متعدد بناءً على ما شُرح فعلاً في الفيديو.

القواعد:
- حلل محتوى الفيديو الفعلي (الصوت والصورة)
- أنشئ ${count} أسئلة اختيار من متعدد مبنية على المحتوى الفعلي
- كل سؤال له 4 خيارات واقعية ومقاربة
- تنوع في مستوى الصعوبة
- حدد اسم الدرس/الموضوع لكل سؤال
- الأسئلة بالعربية الفصحى
- ركز على المفاهيم والمعلومات اللي اتشرحت في الفيديو`;

    const userPrompt = `شاهد هذا الفيديو التعليمي وأنشئ ${count} أسئلة اختيار من متعدد بناءً على محتواه الفعلي.
عنوان الفيديو: ${video.title}
المادة: ${video.subject}
الصف: ${video.grade}
${video.description ? `وصف: ${video.description}` : ""}

مهم جداً: الأسئلة يجب أن تكون مبنية على ما شُرح فعلاً في الفيديو وليس من معرفتك العامة.`;

    let questions: any[] | null = null;

    // Strategy 1: Try analyzing the actual video
    const storagePath = getStoragePath(video.video_url);
    if (storagePath) {
      const { data: signedData } = await sb.storage
        .from("videos")
        .createSignedUrl(storagePath, 3600);

      if (signedData?.signedUrl) {
        // Try with signed URL
        try {
          const resp = await callAIWithVideo(
            LOVABLE_API_KEY, systemPrompt, userPrompt,
            { type: "video_url", video_url: { url: signedData.signedUrl } },
            tools, toolChoice
          );

          if (resp.ok) {
            const aiData = await resp.json();
            const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
            if (toolCall) {
              questions = JSON.parse(toolCall.function.arguments).questions;
            }
          } else {
            console.error("Video URL attempt failed:", resp.status);
          }
        } catch (e) {
          console.error("Video URL attempt error:", e);
        }

        // Try with base64 if URL failed
        if (!questions) {
          try {
            const videoResp = await fetch(signedData.signedUrl);
            if (videoResp.ok) {
              const videoBuffer = await videoResp.arrayBuffer();
              const videoBytes = new Uint8Array(videoBuffer);
              const videoSizeMB = videoBytes.byteLength / (1024 * 1024);

              if (videoSizeMB <= 18) {
                const base64 = uint8ToBase64(videoBytes);
                const contentType = videoResp.headers.get("content-type")?.split(";")[0] || "video/mp4";

                const resp = await callAIWithVideo(
                  LOVABLE_API_KEY, systemPrompt, userPrompt,
                  { inline_data: { mime_type: contentType, data: base64 } },
                  tools, toolChoice
                );

                if (resp.ok) {
                  const aiData = await resp.json();
                  const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
                  if (toolCall) {
                    questions = JSON.parse(toolCall.function.arguments).questions;
                  }
                }
              }
            }
          } catch (e) {
            console.error("Base64 attempt error:", e);
          }
        }
      }
    }

    // Strategy 2: Use cached summary if video analysis failed
    if (!questions) {
      const { data: summary } = await sb
        .from("video_summaries")
        .select("summary")
        .eq("video_id", video_id)
        .single();

      if (summary?.summary) {
        const summaryPrompt = `بناءً على ملخص محتوى الفيديو التالي، أنشئ ${count} أسئلة اختيار من متعدد:

عنوان الفيديو: ${video.title}
المادة: ${video.subject}
الصف: ${video.grade}

ملخص محتوى الفيديو:
${summary.summary}

أنشئ أسئلة مبنية فقط على المعلومات الموجودة في الملخص أعلاه.`;

        try {
          const resp = await callAIWithSummary(
            LOVABLE_API_KEY, systemPrompt, summaryPrompt,
            tools, toolChoice
          );

          if (resp.ok) {
            const aiData = await resp.json();
            const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
            if (toolCall) {
              questions = JSON.parse(toolCall.function.arguments).questions;
            }
          } else if (resp.status === 429) {
            return new Response(JSON.stringify({ error: "rate_limited" }), {
              status: 429,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          } else if (resp.status === 402) {
            return new Response(JSON.stringify({ error: "payment_required" }), {
              status: 402,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        } catch (e) {
          console.error("Summary attempt error:", e);
        }
      }
    }

    if (!questions || questions.length === 0) {
      return new Response(JSON.stringify({ error: "no_questions_generated", message: "لم يتمكن الذكاء الاصطناعي من تحليل الفيديو. تأكد أن الفيديو تم تلخيصه أولاً." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save to question bank if requested
    let savedCount = 0;
    if (save_to_bank) {
      const rows = questions.map(q => ({
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

      if (insertErr) {
        console.error("Insert error:", insertErr);
      } else {
        savedCount = inserted?.length || 0;
      }
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
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
