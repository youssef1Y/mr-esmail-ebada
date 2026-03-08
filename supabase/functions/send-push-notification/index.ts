import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import webpush from "npm:web-push@3.6.7";

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
      return new Response(JSON.stringify({ error: "غير مصرح" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify admin
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "غير مصرح" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check admin role
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");

    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: "غير مصرح - أدمن فقط" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { title, body, target_grades, target_audience } = await req.json();
    if (!title || !body) {
      return new Response(JSON.stringify({ error: "العنوان والمحتوى مطلوبان" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Setup VAPID
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    
    if (!vapidPublicKey || !vapidPrivateKey) {
      return new Response(JSON.stringify({ error: "VAPID keys not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    webpush.setVapidDetails(
      "mailto:admin@ismail-ebada.platform",
      vapidPublicKey,
      vapidPrivateKey
    );

    // Get target user IDs based on audience
    let userIds: string[] = [];
    
    if (target_grades && target_grades.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("user_id")
        .in("grade", target_grades);
      userIds = profiles?.map(p => p.user_id) || [];
    } else if (target_audience === "subscribers") {
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("user_id")
        .eq("is_subscribed", true);
      userIds = profiles?.map(p => p.user_id) || [];
    } else if (target_audience === "non_subscribers") {
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("user_id")
        .eq("is_subscribed", false);
      userIds = profiles?.map(p => p.user_id) || [];
    } else {
      // All users
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("user_id");
      userIds = profiles?.map(p => p.user_id) || [];
    }

    if (userIds.length === 0) {
      return new Response(JSON.stringify({ sent: 0, failed: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get push subscriptions for these users
    const { data: subscriptions } = await supabaseAdmin
      .from("push_subscriptions")
      .select("*")
      .in("user_id", userIds);

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ sent: 0, failed: 0, message: "لا توجد اشتراكات Push" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
      url: "/dashboard",
    });

    let sent = 0;
    let failed = 0;
    const expiredIds: string[] = [];

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        );
        sent++;
      } catch (err: any) {
        failed++;
        // Remove expired/invalid subscriptions
        if (err.statusCode === 404 || err.statusCode === 410) {
          expiredIds.push(sub.id);
        }
      }
    }

    // Clean up expired subscriptions
    if (expiredIds.length > 0) {
      await supabaseAdmin
        .from("push_subscriptions")
        .delete()
        .in("id", expiredIds);
    }

    return new Response(
      JSON.stringify({ sent, failed, expired_cleaned: expiredIds.length }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err) {
    console.error("Push notification error:", err);
    return new Response(JSON.stringify({ error: "حدث خطأ غير متوقع" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
