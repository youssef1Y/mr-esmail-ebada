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
  } catch { /* ignore */ }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Auth check
    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const supabaseUser = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: userErr } = await supabaseUser.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "غير مصرح" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { video_id } = await req.json();
    if (!video_id) {
      return new Response(JSON.stringify({ error: "video_id مطلوب" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check cache first
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

    // Get video info
    const { data: video, error: videoErr } = await adminClient
      .from("videos")
      .select("id, title, description, video_url, subject, grade")
      .eq("id", video_id)
      .single();

    if (videoErr || !video) {
      return new Response(JSON.stringify({ error: "الفيديو غير موجود" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate signed URL for the video
    const storagePath = getStoragePath(video.video_url);
    if (!storagePath) {
      return new Response(JSON.stringify({ error: "لا يمكن الوصول للفيديو" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: signedData, error: signErr } = await adminClient.storage
      .from("videos")
      .createSignedUrl(storagePath, 3600); // 1 hour

    if (signErr || !signedData?.signedUrl) {
      console.error("Signed URL error:", signErr);
      return new Response(JSON.stringify({ error: "لا يمكن الوصول للفيديو" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const videoSignedUrl = signedData.signedUrl;

    // Use Gemini to analyze the video
    const analysisPrompt = `أنت خبير تعليمي. شاهد هذا الفيديو التعليمي وقدم تلخيصاً شاملاً ومفصلاً لمحتواه.

معلومات الفيديو:
- العنوان: ${video.title}
- المادة: ${video.subject}
- الصف: ${video.grade}

المطلوب:
1. لخص محتوى الفيديو بالتفصيل وبالترتيب زي ما هو في الفيديو
2. اذكر كل النقاط والمفاهيم الرئيسية اللي اتشرحت
3. اذكر أي أمثلة أو تطبيقات اتذكرت
4. اذكر أي قواعد أو معادلات أو تعريفات مهمة
5. التلخيص يكون بالعربية وبأسلوب تعليمي واضح
6. رتب التلخيص في نقاط منظمة مع عناوين فرعية
7. لو فيه خطوات حل أو طريقة شغل معينة اتشرحت، اذكرها بالتفصيل

مهم جداً: التلخيص يكون من محتوى الفيديو الفعلي فقط. لا تضف أي معلومات من خارج الفيديو.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: analysisPrompt },
            { type: "image_url", image_url: { url: videoSignedUrl } },
          ],
        }],
        max_tokens: 8192,
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI analysis error:", aiResponse.status, errText);
      
      // Fallback: if video analysis fails, try with just description
      if (video.description) {
        const fallbackSummary = `## ملخص: ${video.title}\n\n${video.description}\n\n*ملاحظة: هذا الملخص مبني على وصف الفيديو المتاح.*`;
        await adminClient.from("video_summaries").upsert({
          video_id: video.id,
          summary: fallbackSummary,
          updated_at: new Date().toISOString(),
        }, { onConflict: "video_id" });

        return new Response(JSON.stringify({ summary: fallbackSummary, cached: false, fallback: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "فشل في تحليل الفيديو، حاول تاني" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const summary = aiData.choices?.[0]?.message?.content || "";

    if (!summary) {
      return new Response(JSON.stringify({ error: "لم يتم إنشاء ملخص" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cache the summary
    await adminClient.from("video_summaries").upsert({
      video_id: video.id,
      summary: summary,
      updated_at: new Date().toISOString(),
    }, { onConflict: "video_id" });

    return new Response(JSON.stringify({ summary, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("summarize-video error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
