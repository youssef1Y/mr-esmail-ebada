import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type PushRequestBody = {
  title?: string;
  body?: string;
  target_grades?: string[];
  target_audience?: "all" | "subscribers" | "non_subscribers";
  target_user_ids?: string[];
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("Push: No auth header");
      return new Response(JSON.stringify({ error: "غير مصرح" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const token = authHeader.replace("Bearer ", "");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser(token);
    if (userError || !user) {
      console.error("Push auth error:", userError?.message);
      return new Response(JSON.stringify({ error: "غير مصرح" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");

    if (!roles || roles.length === 0) {
      console.error("Push: User is not admin:", user.id);
      return new Response(JSON.stringify({ error: "غير مصرح - أدمن فقط" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { title, body, target_grades, target_audience, target_user_ids }: PushRequestBody = await req.json();

    console.log("Push request:", { title, target_grades, target_audience, target_user_ids_count: target_user_ids?.length });

    if (!title || !body) {
      return new Response(JSON.stringify({ error: "العنوان والمحتوى مطلوبان" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error("Push: VAPID keys not configured");
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

    let userIds: string[] = [];

    if (Array.isArray(target_user_ids) && target_user_ids.length > 0) {
      userIds = [...new Set(target_user_ids.filter(Boolean))];
    } else if (target_grades && target_grades.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("user_id")
        .in("grade", target_grades);
      userIds = profiles?.map((p) => p.user_id) || [];
    } else if (target_audience === "subscribers") {
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("user_id")
        .eq("is_subscribed", true);
      userIds = profiles?.map((p) => p.user_id) || [];
    } else if (target_audience === "non_subscribers") {
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("user_id")
        .eq("is_subscribed", false);
      userIds = profiles?.map((p) => p.user_id) || [];
    } else {
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("user_id");
      userIds = profiles?.map((p) => p.user_id) || [];
    }

    console.log("Push: Target users count:", userIds.length);

    if (userIds.length === 0) {
      return new Response(JSON.stringify({ sent: 0, failed: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Fetch subscriptions in batches if needed (supabase default limit is 1000)
    let allSubscriptions: any[] = [];
    const batchSize = 500;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      const { data: subs } = await supabaseAdmin
        .from("push_subscriptions")
        .select("id, endpoint, p256dh, auth, user_id")
        .in("user_id", batch);
      if (subs) allSubscriptions = allSubscriptions.concat(subs);
    }

    console.log("Push: Total subscriptions found:", allSubscriptions.length);

    if (allSubscriptions.length === 0) {
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

    // Send in parallel with concurrency limit
    const sendPromises = allSubscriptions.map(async (sub) => {
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
        console.error(`Push send failed for ${sub.user_id}:`, err?.statusCode, err?.body || err?.message);
        if (err.statusCode === 404 || err.statusCode === 410) {
          expiredIds.push(sub.id);
        }
      }
    });

    await Promise.allSettled(sendPromises);

    if (expiredIds.length > 0) {
      await supabaseAdmin
        .from("push_subscriptions")
        .delete()
        .in("id", expiredIds);
      console.log("Push: Cleaned expired subscriptions:", expiredIds.length);
    }

    console.log("Push result:", { sent, failed, expired_cleaned: expiredIds.length });

    return new Response(
      JSON.stringify({ sent, failed, expired_cleaned: expiredIds.length }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err: any) {
    console.error("Push notification error:", err?.message || err);
    return new Response(JSON.stringify({ error: "حدث خطأ غير متوقع" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
