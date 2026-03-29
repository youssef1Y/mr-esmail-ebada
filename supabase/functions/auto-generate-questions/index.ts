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

    // Check if already generated
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

    if (video.questions_generated) {
      console.log("Questions already generated for:", video.title);
      return new Response(JSON.stringify({ status: "already_generated" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Auto-generating questions for video: ${video.title}`);

    // Step 1: Summarize video first
    const summarizeResp = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-video-questions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({
          video_id: video.id,
          question_count: 10,
          save_to_bank: true,
        }),
      }
    );

    const result = await summarizeResp.json();

    if (result.error) {
      console.error("Generation error:", result.error, result.message);
      return new Response(JSON.stringify({ error: result.error }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const savedCount = result.saved_to_bank || 0;
    console.log(`Generated ${result.questions?.length || 0} questions, saved ${savedCount} to bank`);

    // Mark video as questions generated
    await sb.from("videos").update({ questions_generated: true }).eq("id", video_id);

    return new Response(JSON.stringify({
      status: "success",
      questions_count: result.questions?.length || 0,
      saved_to_bank: savedCount,
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
