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
      console.log("Returning cached summary for video:", video_id);
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
      console.error("Cannot extract storage path from:", video.video_url);
      return new Response(JSON.stringify({ error: "لا يمكن الوصول للفيديو" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: signedData, error: signErr } = await adminClient.storage
      .from("videos")
      .createSignedUrl(storagePath, 3600);

    if (signErr || !signedData?.signedUrl) {
      console.error("Signed URL error:", signErr);
      return new Response(JSON.stringify({ error: "لا يمكن الوصول للفيديو" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const videoSignedUrl = signedData.signedUrl;
    console.log("Got signed URL for video:", video.title, "storagePath:", storagePath);

    // Download the video file to send as base64 (for small videos)
    // or use the URL directly
    const analysisPrompt = `أنت خبير تعليمي متخصص. شاهد هذا الفيديو التعليمي بعناية شديدة وقدم تلخيصاً شاملاً ومفصلاً لمحتواه الفعلي.

معلومات الفيديو:
- العنوان: ${video.title}
- المادة: ${video.subject}
- الصف: ${video.grade}

تعليمات مهمة جداً:
1. لخص المحتوى الفعلي اللي في الفيديو بالتفصيل - اللي المدرس بيشرحه فعلاً
2. اذكر كل النقاط والمفاهيم الرئيسية اللي اتشرحت بالترتيب
3. اذكر أي أمثلة أو تمارين أو تطبيقات اتحلت في الفيديو
4. اذكر أي قواعد أو معادلات أو تعريفات ذكرها المدرس
5. لو فيه خطوات حل اتشرحت، اذكرها بالتفصيل
6. التلخيص يكون بالعربية وبأسلوب تعليمي واضح
7. رتب التلخيص في نقاط منظمة مع عناوين فرعية

⚠️ مهم جداً: التلخيص لازم يكون من محتوى الفيديو الفعلي فقط اللي شفته. لا تخترع أو تضيف أي معلومات من عندك. لو مش قادر تشوف محتوى الفيديو بوضوح قول كده.`;

    // Try sending video URL to Gemini for multimodal analysis
    console.log("Sending video to AI for analysis...");
    
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
            { 
              type: "image_url", 
              image_url: { 
                url: videoSignedUrl,
              } 
            },
          ],
        }],
        max_tokens: 8192,
        temperature: 0.2,
      }),
    });

    console.log("AI response status:", aiResponse.status);

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI video analysis failed:", aiResponse.status, errText);
      
      // Fallback: Try downloading video and sending as base64 data URL
      console.log("Trying fallback: downloading video...");
      try {
        const videoResp = await fetch(videoSignedUrl);
        if (videoResp.ok) {
          const videoBuffer = await videoResp.arrayBuffer();
          const videoSizeMB = videoBuffer.byteLength / (1024 * 1024);
          console.log("Video size:", videoSizeMB.toFixed(2), "MB");
          
          // Only try base64 for videos under 20MB
          if (videoSizeMB <= 20) {
            const base64 = btoa(String.fromCharCode(...new Uint8Array(videoBuffer)));
            const dataUrl = `data:video/mp4;base64,${base64}`;
            
            console.log("Sending video as base64 data URL...");
            const fallbackAiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
                    { 
                      type: "image_url", 
                      image_url: { url: dataUrl } 
                    },
                  ],
                }],
                max_tokens: 8192,
                temperature: 0.2,
              }),
            });

            console.log("Fallback AI response status:", fallbackAiResponse.status);
            
            if (fallbackAiResponse.ok) {
              const fallbackData = await fallbackAiResponse.json();
              const fallbackSummary = fallbackData.choices?.[0]?.message?.content || "";
              
              if (fallbackSummary && fallbackSummary.length > 50) {
                console.log("Fallback succeeded! Summary length:", fallbackSummary.length);
                await adminClient.from("video_summaries").upsert({
                  video_id: video.id,
                  summary: fallbackSummary,
                  updated_at: new Date().toISOString(),
                }, { onConflict: "video_id" });

                return new Response(JSON.stringify({ summary: fallbackSummary, cached: false }), {
                  headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
              }
            } else {
              const fallbackErr = await fallbackAiResponse.text();
              console.error("Fallback also failed:", fallbackAiResponse.status, fallbackErr);
            }
          } else {
            console.log("Video too large for base64:", videoSizeMB.toFixed(2), "MB");
          }
        }
      } catch (dlErr) {
        console.error("Video download error:", dlErr);
      }
      
      // Final fallback: use description if available
      if (video.description) {
        const descSummary = `## ملخص: ${video.title}\n\n${video.description}\n\n*ملاحظة: هذا ملخص مبدئي من وصف الفيديو. حاول تاني لاحقاً للحصول على تلخيص كامل من محتوى الفيديو.*`;
        return new Response(JSON.stringify({ summary: descSummary, cached: false, fallback: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "فشل في تحليل الفيديو، حاول تاني" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const summary = aiData.choices?.[0]?.message?.content || "";
    console.log("AI summary generated, length:", summary.length);

    if (!summary || summary.length < 50) {
      console.error("Summary too short or empty:", summary);
      return new Response(JSON.stringify({ error: "لم يتم إنشاء ملخص كافي" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cache the summary
    await adminClient.from("video_summaries").upsert({
      video_id: video.id,
      summary: summary,
      updated_at: new Date().toISOString(),
    }, { onConflict: "video_id" });

    console.log("Summary cached successfully for video:", video.title);
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
