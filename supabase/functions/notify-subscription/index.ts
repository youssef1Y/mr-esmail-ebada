import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "npm:resend@4.0.0";
import { encode as hexEncode } from "https://deno.land/std@0.190.0/encoding/hex.ts";

const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "esmail.ahmed590@gmail.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { fullName, grade, senderPhone, transferNumber, amount, receiptPath, requestId } = await req.json();

    const esc = (s: string) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

    if (!fullName || !senderPhone || !transferNumber) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Generate signed URL for receipt image
    let receiptUrl = "";
    if (receiptPath) {
      const adminClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      const { data: signedData } = await adminClient.storage
        .from("receipts")
        .createSignedUrl(receiptPath, 60 * 60 * 24 * 7);
      if (signedData?.signedUrl) {
        receiptUrl = signedData.signedUrl;
      }
    }

    const now = new Date();
    const submissionDate = now.toLocaleDateString("ar-EG", {
      year: "numeric", month: "long", day: "numeric",
    });
    const submissionTime = now.toLocaleTimeString("ar-EG", {
      hour: "2-digit", minute: "2-digit",
    });

    // Generate action buttons if requestId is provided
    let actionButtonsHtml = "";
    if (requestId) {
      const baseUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/subscription-action`;
      const approveToken = await generateToken(requestId, "approve");
      const rejectToken = await generateToken(requestId, "reject");

      const approveUrl = `${baseUrl}?id=${requestId}&action=approve&token=${approveToken}`;
      const rejectUrl = `${baseUrl}?id=${requestId}&action=reject&token=${rejectToken}`;

      actionButtonsHtml = `
        <div style="margin-top: 28px; text-align: center;">
          <h3 style="color: #333; margin-bottom: 16px; font-size: 16px;">⚡ إجراء سريع من الإيميل:</h3>
          <a href="${approveUrl}" target="_blank" 
             style="display: inline-block; background: #2d6a4f; color: white; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; margin: 0 8px;">
            ✅ قبول الطلب
          </a>
          <a href="${rejectUrl}" target="_blank" 
             style="display: inline-block; background: #e53935; color: white; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; margin: 0 8px;">
            ❌ رفض الطلب
          </a>
          <p style="color: #999; font-size: 12px; margin-top: 12px;">أو يمكنك إدارة الطلب من لوحة التحكم</p>
        </div>
      `;
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey) {
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: "منصة الأستاذ إسماعيل <onboarding@resend.dev>",
        to: [ADMIN_EMAIL],
        subject: `طلب اشتراك جديد: ${fullName}`,
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2d6a4f; border-bottom: 2px solid #2d6a4f; padding-bottom: 10px;">🔔 طلب اشتراك جديد</h2>
            <table style="border-collapse: collapse; width: 100%; margin-top: 16px;">
              <tr><td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; background: #f9f9f9; width: 40%;">اسم الطالب</td><td style="padding: 10px; border: 1px solid #ddd;">${esc(fullName)}</td></tr>
              <tr><td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; background: #f9f9f9;">الصف الدراسي</td><td style="padding: 10px; border: 1px solid #ddd;">${esc(grade || "غير محدد")}</td></tr>
              <tr><td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; background: #f9f9f9;">رقم فودافون كاش (المحوّل منه)</td><td style="padding: 10px; border: 1px solid #ddd; direction: ltr; text-align: right; font-size: 18px; font-weight: bold; color: #e53935;">${esc(senderPhone)}</td></tr>
              <tr><td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; background: #f9f9f9;">رقم التحويل (المرجع)</td><td style="padding: 10px; border: 1px solid #ddd; direction: ltr; text-align: right;">${esc(transferNumber)}</td></tr>
              <tr><td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; background: #f9f9f9;">المبلغ</td><td style="padding: 10px; border: 1px solid #ddd;">${esc(String(amount))} جنيه مصري</td></tr>
              <tr><td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; background: #f9f9f9;">تاريخ الإرسال</td><td style="padding: 10px; border: 1px solid #ddd;">${submissionDate}</td></tr>
              <tr><td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; background: #f9f9f9;">وقت الإرسال</td><td style="padding: 10px; border: 1px solid #ddd;">${submissionTime}</td></tr>
            </table>
            ${receiptUrl
              ? `<div style="margin-top: 24px; padding: 16px; background: #f0fdf4; border-radius: 8px;">
                  <h3 style="color: #2d6a4f; margin-top: 0;">📎 صورة إيصال التحويل:</h3>
                  <a href="${receiptUrl}" target="_blank" style="color: #2754C5; text-decoration: underline; font-weight: bold;">اضغط هنا لعرض الإيصال</a>
                  <br/><br/>
                  <img src="${receiptUrl}" alt="إيصال التحويل" style="max-width: 100%; max-height: 500px; border: 1px solid #ddd; border-radius: 8px;" />
                </div>`
              : '<p style="margin-top: 16px; color: #999;">⚠️ لم يتم رفع إيصال</p>'}
            ${actionButtonsHtml}
          </div>
        `,
      });
      console.log("Email sent successfully to admin with action buttons");
    } else {
      console.error("RESEND_API_KEY not configured");
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error:", error.message);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
