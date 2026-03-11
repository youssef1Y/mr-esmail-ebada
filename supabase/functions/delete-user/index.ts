import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    let callerUserId: string;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      callerUserId = payload.sub;
      if (!callerUserId) throw new Error("No sub");
    } catch {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { target_user_id } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Determine if self-delete or admin-delete
    const isSelfDelete = !target_user_id || target_user_id === callerUserId;
    const userIdToDelete = isSelfDelete ? callerUserId : target_user_id;

    // If admin is deleting another user, verify admin role
    if (!isSelfDelete) {
      const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
        _user_id: callerUserId,
        _role: "admin",
      });
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Not authorized" }), {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    // Delete related data in order (tables that reference user_id but don't have CASCADE)
    const tables = [
      "competition_entries",
      "exam_answers",
      "exam_attempts",
      "homework_submissions",
      "video_homework_submissions",
      "video_comments",
      "video_views",
      "student_points",
      "student_keys",
      "student_notifications",
      "push_subscriptions",
      "subscription_requests",
      "referral_completions",
      "referral_codes",
      "messages",
      "profiles",
      "user_roles",
    ];

    for (const table of tables) {
      if (table === "exam_answers") {
        // Delete exam_answers via attempt_id
        const { data: attempts } = await supabaseAdmin
          .from("exam_attempts")
          .select("id")
          .eq("user_id", userIdToDelete);
        if (attempts && attempts.length > 0) {
          const attemptIds = attempts.map((a: any) => a.id);
          await supabaseAdmin.from("exam_answers").delete().in("attempt_id", attemptIds);
        }
        continue;
      }
      if (table === "referral_completions") {
        // Delete where user is either referrer or referred
        await supabaseAdmin.from(table).delete().eq("referrer_id", userIdToDelete);
        await supabaseAdmin.from(table).delete().eq("referred_user_id", userIdToDelete);
        continue;
      }
      await supabaseAdmin.from(table).delete().eq("user_id", userIdToDelete);
    }

    // Finally delete the auth user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userIdToDelete);
    if (deleteError) {
      console.error("Error deleting auth user:", deleteError);
      return new Response(JSON.stringify({ error: "Failed to delete user: " + deleteError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
