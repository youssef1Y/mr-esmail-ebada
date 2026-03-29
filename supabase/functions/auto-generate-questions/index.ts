import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { video_id } = await req.json();
    if (!video_id) throw new Error("video_id is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: video } = await sb
      .from("videos")
      .select("id, title, subject, grade, video_url, description, questions_generated")
      .eq("id", video_id)
      .single();

    if (!video) {
      console.log("Video not found:", video_id);
      return new Response(JSON.stringify({ error: "video_not_found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const totalTarget = 200;

    const { count: existingCount = 0 } = await sb
      .from("question_bank")
      .select("id", { count: "exact", head: true })
      .eq("video_id", video_id);

    if ((existingCount ?? 0) >= totalTarget && video.questions_generated) {
      console.log("Questions already generated for:", video.title, existingCount);
      return new Response(JSON.stringify({ status: "already_generated", saved_to_bank: existingCount }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Auto-generating questions for video: ${video.title}`);

    let totalSaved = existingCount ?? 0;
    let totalGenerated = 0;
    const batchSize = 20;
    const batches = Math.ceil(Math.max(totalTarget - totalSaved, 0) / batchSize);

    for (let batch = 0; batch < batches; batch++) {
      try {
        const { data: existingRows } = await sb
          .from("question_bank")
          .select("question_text")
          .eq("video_id", video.id)
          .limit(1000);

        const excludedQuestions = (existingRows || [])
          .map((row: { question_text?: string | null }) => row.question_text)
          .filter((value): value is string => typeof value === "string" && value.trim().length > 0);

        const resp = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-video-questions`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({
              video_id: video.id,
              question_count: batchSize,
              save_to_bank: true,
              diversity_seed: crypto.randomUUID(),
              excluded_questions: excludedQuestions,
            }),
          }
        );

        const result = await resp.json();
        if (result.error) {
          console.error(`Batch ${batch + 1} error:`, result.error);
          if (result.error === "rate_limited") break;
          continue;
        }

        totalGenerated += result.questions?.length || 0;
        totalSaved += result.saved_to_bank || 0;
        console.log(`Batch ${batch + 1}/${batches}: generated ${result.questions?.length || 0}, total saved: ${totalSaved}`);
      } catch (e) {
        console.error(`Batch ${batch + 1} failed:`, e);
      }
    }

    console.log(`Finished: total generated ${totalGenerated}, saved ${totalSaved}`);

    if (totalSaved >= 100) {
      await sb.from("videos").update({ questions_generated: true }).eq("id", video_id);
    }

    return new Response(JSON.stringify({
      status: "success",
      questions_count: totalGenerated,
      saved_to_bank: totalSaved,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
