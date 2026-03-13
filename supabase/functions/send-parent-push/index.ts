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
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { action, parent_phone, title, body, endpoint, p256dh, auth, session_token } = await req.json();

    // ========== SUBSCRIBE ==========
    if (action === "subscribe") {
      if (!parent_phone || !endpoint || !p256dh || !auth || !session_token) {
        return new Response(JSON.stringify({ error: "بيانات ناقصة" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Validate session
      const { data: sessionData } = await supabaseAdmin
        .from("parent_sessions")
        .select("parent_id, expires_at")
        .eq("token", session_token)
        .single();

      if (!sessionData || new Date(sessionData.expires_at) < new Date()) {
        return new Response(JSON.stringify({ error: "غير مصرح" }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const { error } = await supabaseAdmin
        .from("parent_push_subscriptions")
        .upsert(
          { parent_phone, endpoint, p256dh, auth },
          { onConflict: "parent_phone,endpoint" }
        );

      if (error) {
        console.error("Parent push subscribe error:", error);
        return new Response(JSON.stringify({ error: "فشل حفظ الاشتراك" }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // ========== UNSUBSCRIBE ==========
    if (action === "unsubscribe") {
      if (!parent_phone || !endpoint || !session_token) {
        return new Response(JSON.stringify({ error: "بيانات ناقصة" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const { data: sessionData } = await supabaseAdmin
        .from("parent_sessions")
        .select("parent_id")
        .eq("token", session_token)
        .single();

      if (!sessionData) {
        return new Response(JSON.stringify({ error: "غير مصرح" }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      await supabaseAdmin
        .from("parent_push_subscriptions")
        .delete()
        .eq("parent_phone", parent_phone)
        .eq("endpoint", endpoint);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // ========== SEND PUSH ==========
    if (action === "send") {
      // Verify admin
      const authHeader = req.headers.get("Authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.replace("Bearer ", "");
        const supabaseUser = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_ANON_KEY")!,
          { global: { headers: { Authorization: authHeader } } }
        );
        const { data: { user } } = await supabaseUser.auth.getUser(token);
        if (!user) {
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
          return new Response(JSON.stringify({ error: "أدمن فقط" }), {
            status: 403,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
      } else {
        return new Response(JSON.stringify({ error: "غير مصرح" }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      if (!parent_phone || !title || !body) {
        return new Response(JSON.stringify({ error: "بيانات ناقصة" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
      const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
      if (!vapidPublicKey || !vapidPrivateKey) {
        return new Response(JSON.stringify({ error: "VAPID keys not configured" }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      webpush.setVapidDetails("mailto:admin@ismail-ebada.platform", vapidPublicKey, vapidPrivateKey);

      const { data: subs } = await supabaseAdmin
        .from("parent_push_subscriptions")
        .select("id, endpoint, p256dh, auth")
        .eq("parent_phone", parent_phone);

      if (!subs || subs.length === 0) {
        return new Response(JSON.stringify({ sent: 0, message: "لا يوجد اشتراك push لولي الأمر" }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const payload = JSON.stringify({
        title,
        body,
        icon: "/pwa-192x192.png",
        badge: "/pwa-192x192.png",
        url: "/parent/dashboard",
      });

      let sent = 0;
      let failed = 0;
      const expiredIds: string[] = [];

      for (const sub of subs) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          );
          sent++;
        } catch (err: any) {
          failed++;
          if (err.statusCode === 404 || err.statusCode === 410) {
            expiredIds.push(sub.id);
          }
        }
      }

      if (expiredIds.length > 0) {
        await supabaseAdmin.from("parent_push_subscriptions").delete().in("id", expiredIds);
      }

      return new Response(JSON.stringify({ sent, failed, expired_cleaned: expiredIds.length }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ error: "إجراء غير معروف" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err: any) {
    console.error("Parent push error:", err?.message || err);
    return new Response(JSON.stringify({ error: "حدث خطأ غير متوقع" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
