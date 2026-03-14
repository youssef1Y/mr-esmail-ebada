import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
  } catch {
    // ignore
  }

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

  // If model didn't follow format, reject to avoid fake/title-based summary
  return null;
}

async function callGatewayWithVideo(
  LOVABLE_API_KEY: string,
  prompt: string,
  videoPart: Record<string, unknown>
): Promise<{ ok: boolean; summary?: string; error?: string }> {
  const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            videoPart,
          ],
        },
      ],
      max_tokens: 4096,
      temperature: 0.1,
    }),
  });

  if (!aiResponse.ok) {
    const errText = await aiResponse.text();
    return { ok: false, error: `status=${aiResponse.status} body=${errText}` };
  }

  const aiData = await aiResponse.json();
  const raw = aiData.choices?.[0]?.message?.content || "";
  const summary = extractSummaryFromAi(raw);

  if (!summary || summary.length < 80) {
    return { ok: false, error: "model_did_not_confirm_video_analysis" };
  }

  return { ok: true, summary };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");

    const supabaseUser = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const {
      data: { user },
      error: userErr,
    } = await supabaseUser.auth.getUser();

    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "غير مصرح" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { video_id } = await req.json();
    if (!video_id) {
      return new Response(JSON.stringify({ error: "video_id مطلوب" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: cached } = await adminClient
      .from("video_summaries")
      .select("summary")
      .eq("video_id", video_id)
      .single();

    if (cached?.summary) {
      return new Response(JSON.stringify({ summary: cached.summary, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: video, error: videoErr } = await adminClient
      .from("videos")
      .select("id, title, video_url, subject, grade")
      .eq("id", video_id)
      .single();

    if (videoErr || !video) {
      return new Response(JSON.stringify({ error: "الفيديو غير موجود" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const storagePath = getStoragePath(video.video_url);
    if (!storagePath) {
      return new Response(JSON.stringify({ error: "لا يمكن الوصول للفيديو" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: signedData, error: signErr } = await adminClient.storage
      .from("videos")
      .createSignedUrl(storagePath, 3600);

    if (signErr || !signedData?.signedUrl) {
      console.error("Signed URL error:", signErr);
      return new Response(JSON.stringify({ error: "لا يمكن الوصول للفيديو" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const analysisPrompt = `أنت خبير تعليمي. مطلوب تحليل الفيديو نفسه ثم تلخيصه.

معلومات الفيديو:
- العنوان: ${video.title}
- المادة: ${video.subject}
- الصف: ${video.grade}

قواعد إلزامية:
1) لا تعتمد على العنوان فقط إطلاقاً.
2) لو لم تستطع مشاهدة محتوى الفيديو الفعلي، اكتب فقط: STATUS:NO_VIDEO
3) لو شاهدت الفيديو فعلاً، ابدأ الرد بـ STATUS:OK ثم اكتب ملخصاً تفصيلياً مرتباً بعناوين فرعية ونقاط.
4) اذكر المفاهيم، الأمثلة، خطوات الشرح، وأي قواعد/تعريفات وردت داخل الفيديو.
5) الرد بالعربية.`;

    // Attempt 1: direct signed URL as video_url
    const attempt1 = await callGatewayWithVideo(
      LOVABLE_API_KEY,
      analysisPrompt,
      { type: "video_url", video_url: { url: signedData.signedUrl } }
    );

    if (attempt1.ok && attempt1.summary) {
      await adminClient.from("video_summaries").upsert(
        {
          video_id: video.id,
          summary: attempt1.summary,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "video_id" }
      );

      return new Response(JSON.stringify({ summary: attempt1.summary, cached: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.error("Video URL attempt failed:", attempt1.error);

    // Attempt 2: data URL (base64), memory-safe conversion
    const videoResp = await fetch(signedData.signedUrl);
    if (!videoResp.ok) {
      return new Response(JSON.stringify({ error: "تعذر تحميل الفيديو للتحليل" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const videoBuffer = await videoResp.arrayBuffer();
    const videoBytes = new Uint8Array(videoBuffer);
    const videoSizeMB = videoBytes.byteLength / (1024 * 1024);

    if (videoSizeMB > 18) {
      return new Response(
        JSON.stringify({ error: "الفيديو كبير جداً للتلخيص حالياً، حاول على نسخة أصغر" }),
        {
          status: 413,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const base64 = uint8ToBase64(videoBytes);
    const dataUrl = `data:video/mp4;base64,${base64}`;

    const attempt2 = await callGatewayWithVideo(
      LOVABLE_API_KEY,
      analysisPrompt,
      { type: "video_url", video_url: { url: dataUrl } }
    );

    if (attempt2.ok && attempt2.summary) {
      await adminClient.from("video_summaries").upsert(
        {
          video_id: video.id,
          summary: attempt2.summary,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "video_id" }
      );

      return new Response(JSON.stringify({ summary: attempt2.summary, cached: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.error("Data URL attempt failed:", attempt2.error);

    return new Response(
      JSON.stringify({ error: "تعذر تلخيص محتوى الفيديو الفعلي حالياً، حاول مرة تانية بعد قليل" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("summarize-video error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
