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
    const { phone } = await req.json();
    if (!phone) {
      return new Response(JSON.stringify({ error: "رقم الهاتف مطلوب" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const normalizedPhone = phone.trim().replace(/\s+/g, "");
    const email = `${normalizedPhone}@ismail-ebada.platform`;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Find the auth user by email (filtered query to avoid pagination misses)
    const { data: usersData, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
      filter: email,
    });

    if (listErr) {
      console.error("List users error:", listErr);
      return new Response(JSON.stringify({ cleaned: false, reason: "lookup_failed" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const authUser = usersData?.users?.find((u: any) => u.email === email);
    if (!authUser) {
      // No auth user exists — safe to register
      return new Response(JSON.stringify({ cleaned: true, reason: "no_auth_user" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check if profile exists
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("user_id", authUser.id)
      .maybeSingle();

    if (profile) {
      // Profile exists — this is a real account, not orphan
      return new Response(JSON.stringify({ cleaned: false, reason: "account_active" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Orphan account: auth exists but no profile — delete auth user
    console.log(`Cleaning orphan account for ${normalizedPhone}, user_id: ${authUser.id}`);

    // Clean up any remaining data
    const tables = [
      "competition_entries", "exam_attempts", "homework_submissions",
      "video_homework_submissions", "video_comments", "video_views",
      "student_points", "student_keys", "student_notifications",
      "push_subscriptions", "subscription_requests", "referral_codes",
      "messages", "user_roles",
    ];

    for (const table of tables) {
      await supabaseAdmin.from(table).delete().eq("user_id", authUser.id);
    }

    // Delete referral completions
    await supabaseAdmin.from("referral_completions").delete().eq("referrer_id", authUser.id);
    await supabaseAdmin.from("referral_completions").delete().eq("referred_user_id", authUser.id);

    // Delete auth user
    const { error: deleteErr } = await supabaseAdmin.auth.admin.deleteUser(authUser.id);
    if (deleteErr) {
      console.error("Delete auth user error:", deleteErr);
      return new Response(JSON.stringify({ cleaned: false, reason: "delete_failed" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ cleaned: true, reason: "orphan_removed" }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err: any) {
    console.error("Cleanup error:", err);
    return new Response(JSON.stringify({ error: "حدث خطأ غير متوقع" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
