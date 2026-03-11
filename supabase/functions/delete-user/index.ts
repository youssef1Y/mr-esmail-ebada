import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    const callerUserId = authData?.user?.id;

    if (authError || !callerUserId) {
      return jsonResponse({ error: "Invalid token" }, 401);
    }

    const requestBody = await req.json().catch(() => ({}));
    const targetUserId =
      typeof requestBody?.target_user_id === "string" && requestBody.target_user_id.trim().length > 0
        ? requestBody.target_user_id
        : null;

    const isSelfDelete = !targetUserId || targetUserId === callerUserId;
    const userIdToDelete = isSelfDelete ? callerUserId : targetUserId;

    if (!isSelfDelete) {
      const { data: isAdmin, error: roleError } = await supabaseAdmin.rpc("has_role", {
        _user_id: callerUserId,
        _role: "admin",
      });

      if (roleError || !isAdmin) {
        return jsonResponse({ error: "Not authorized" }, 403);
      }
    }

    // Critical fix: delete auth user first, so phone/email are always released.
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userIdToDelete);
    const warnings: string[] = [];

    if (authDeleteError && !/not found/i.test(authDeleteError.message)) {
      console.error("Error deleting auth user:", authDeleteError);
      return jsonResponse({ error: "Failed to delete user: " + authDeleteError.message }, 500);
    }

    if (authDeleteError && /not found/i.test(authDeleteError.message)) {
      warnings.push("Auth user already deleted");
    }

    // Cleanup remaining application data (best-effort).
    const deleteByUserId = async (table: string) => {
      const { error } = await supabaseAdmin.from(table).delete().eq("user_id", userIdToDelete);
      if (error) {
        console.error(`Cleanup error in ${table}:`, error);
        warnings.push(`${table}: ${error.message}`);
      }
    };

    const { data: attempts, error: attemptsError } = await supabaseAdmin
      .from("exam_attempts")
      .select("id")
      .eq("user_id", userIdToDelete);

    if (attemptsError) {
      warnings.push(`exam_attempts(fetch): ${attemptsError.message}`);
    } else if (attempts && attempts.length > 0) {
      const attemptIds = attempts.map((a: { id: string }) => a.id);
      const { error: examAnswersDeleteError } = await supabaseAdmin
        .from("exam_answers")
        .delete()
        .in("attempt_id", attemptIds);
      if (examAnswersDeleteError) {
        warnings.push(`exam_answers: ${examAnswersDeleteError.message}`);
      }
    }

    const referralReferrerDelete = await supabaseAdmin
      .from("referral_completions")
      .delete()
      .eq("referrer_id", userIdToDelete);
    if (referralReferrerDelete.error) {
      warnings.push(`referral_completions(referrer): ${referralReferrerDelete.error.message}`);
    }

    const referralReferredDelete = await supabaseAdmin
      .from("referral_completions")
      .delete()
      .eq("referred_user_id", userIdToDelete);
    if (referralReferredDelete.error) {
      warnings.push(`referral_completions(referred): ${referralReferredDelete.error.message}`);
    }

    const tables = [
      "competition_entries",
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
      "referral_codes",
      "messages",
      "profiles",
      "user_roles",
    ];

    for (const table of tables) {
      await deleteByUserId(table);
    }

    return jsonResponse({ success: true, warnings });
  } catch (error: any) {
    console.error("Error:", error);
    return jsonResponse({ error: error.message || "Internal server error" }, 500);
  }
});
