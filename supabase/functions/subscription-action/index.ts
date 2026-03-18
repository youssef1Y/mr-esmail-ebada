import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { encode as hexEncode } from "https://deno.land/std@0.190.0/encoding/hex.ts";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate HMAC token for request verification
async function generateToken(requestId: string, action: string): Promise<string> {
  const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${requestId}:${action}`)
  );
  return new TextDecoder().decode(hexEncode(new Uint8Array(signature)));
}

// Verify HMAC token
async function verifyToken(requestId: string, action: string, token: string): Promise<boolean> {
  const expected = await generateToken(requestId, action);
  return token === expected;
}

// Export for use by notify-subscription
export { generateToken };

async function sendPushToUser(supabaseAdmin: any, userId: string, title: string, body: string) {
  const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
  if (!vapidPublicKey || !vapidPrivateKey) return;

  webpush.setVapidDetails(
    "mailto:admin@ismail-ebada.platform",
    vapidPublicKey,
    vapidPrivateKey
  );

  const { data: subs } = await supabaseAdmin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subs || subs.length === 0) return;

  const payload = JSON.stringify({
    title,
    body,
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    url: "/dashboard",
  });

  const expiredIds: string[] = [];

  await Promise.allSettled(subs.map(async (sub: any) => {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      );
    } catch (err: any) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        expiredIds.push(sub.id);
      }
    }
  }));

  if (expiredIds.length > 0) {
    await supabaseAdmin.from("push_subscriptions").delete().in("id", expiredIds);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const requestId = url.searchParams.get("id");
    const action = url.searchParams.get("action"); // "approve" or "reject"
    const token = url.searchParams.get("token");

    if (!requestId || !action || !token) {
      return new Response(renderHTML("❌ رابط غير صالح", "البيانات المطلوبة غير متوفرة."), {
        status: 400,
        headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
      });
    }

    if (action !== "approve" && action !== "reject") {
      return new Response(renderHTML("❌ إجراء غير صالح", "الإجراء المطلوب غير معروف."), {
        status: 400,
        headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
      });
    }

    const valid = await verifyToken(requestId, action, token);
    if (!valid) {
      return new Response(renderHTML("❌ رابط غير صالح", "التوقيع غير صحيح. ربما الرابط قديم أو تم التلاعب به."), {
        status: 403,
        headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if request exists and is still pending
    const { data: request, error: reqError } = await supabaseAdmin
      .from("subscription_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (reqError || !request) {
      return new Response(renderHTML("❌ طلب غير موجود", "لم يتم العثور على طلب الاشتراك."), {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
      });
    }

    if (request.status !== "pending") {
      const statusText = request.status === "approved" ? "تمت الموافقة عليه" : "تم رفضه";
      return new Response(renderHTML("⚠️ تم التعامل مع الطلب مسبقاً", `هذا الطلب ${statusText} بالفعل.`), {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
      });
    }

    // Get student profile
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("grade, full_name")
      .eq("user_id", request.user_id)
      .single();

    if (action === "approve") {
      // Approve
      await supabaseAdmin.from("subscription_requests").update({ status: "approved" }).eq("id", requestId);

      const grade = profile?.grade || "";
      const newPrice = grade.includes("إعدادي") ? 150 : 200;
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      await supabaseAdmin.from("profiles").update({
        is_subscribed: true,
        subscription_price: newPrice,
        subscription_expires_at: expiresAt,
      }).eq("user_id", request.user_id);

      await supabaseAdmin.from("student_notifications").insert({
        user_id: request.user_id,
        title: "تم تفعيل اشتراكك! 🎉",
        body: "تم تفعيل اشتراكك بنجاح. يمكنك الآن الوصول لجميع المحتوى التعليمي. الاشتراك صالح لمدة 30 يوم.",
        type: "subscription_approved",
      });

      await sendPushToUser(
        supabaseAdmin,
        request.user_id,
        "🎉 تم تفعيل اشتراكك!",
        "يمكنك الآن الوصول لجميع المحتوى التعليمي. الاشتراك صالح لمدة 30 يوم."
      );

    const studentName = escapeHtml(profile?.full_name || "الطالب");
      return new Response(
        renderHTML("✅ تم تفعيل الاشتراك بنجاح", `تم تفعيل اشتراك ${studentName} لمدة 30 يوم وتم إشعاره.`),
        { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders } }
      );
    } else {
      // Reject
      await supabaseAdmin.from("subscription_requests").update({ status: "rejected" }).eq("id", requestId);

      await supabaseAdmin.from("student_notifications").insert({
        user_id: request.user_id,
        title: "تم رفض طلب الاشتراك",
        body: "تم رفض طلب اشتراكك. يرجى التأكد من بيانات التحويل وإعادة المحاولة أو التواصل مع الإدارة.",
        type: "subscription_rejected",
      });

      await sendPushToUser(
        supabaseAdmin,
        request.user_id,
        "❌ تم رفض طلب الاشتراك",
        "تم رفض طلب اشتراكك. يرجى مراجعة بيانات التحويل وإعادة المحاولة."
      );

      const studentName = escapeHtml(profile?.full_name || "الطالب");
      return new Response(
        renderHTML("❌ تم رفض الطلب", `تم رفض طلب اشتراك ${studentName} وتم إشعاره.`),
        { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders } }
      );
    }
  } catch (err: any) {
    console.error("Email action error:", err?.message || err);
    return new Response(renderHTML("❌ حدث خطأ", "حدث خطأ غير متوقع. يرجى المحاولة من لوحة التحكم."), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
    });
  }
});

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function renderHTML(title: string, message: string): string {
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
      background: linear-gradient(135deg, #1a3a2a, #0d1f17);
      color: #fff;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
    }
    .card {
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 40px;
      max-width: 500px;
      text-align: center;
      border: 1px solid rgba(255,255,255,0.2);
    }
    h1 { font-size: 28px; margin-bottom: 16px; }
    p { font-size: 18px; opacity: 0.9; line-height: 1.6; }
    .logo { font-size: 48px; margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">📚</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <p style="margin-top: 24px; font-size: 14px; opacity: 0.6;">منصة الأستاذ إسماعيل عبادة</p>
  </div>
</body>
</html>`;
}
