import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "npm:resend@4.0.0";

const ADMIN_EMAIL = "esmail.ahmed590@gmail.com";

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

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { fullName, grade, senderPhone, transferNumber, amount, receiptPath } = await req.json();

    if (!fullName || !senderPhone || !transferNumber) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Generate signed URL for receipt image if available
    let receiptUrl = "";
    if (receiptPath) {
      const adminClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      const { data: signedData } = await adminClient.storage
        .from("receipts")
        .createSignedUrl(receiptPath, 60 * 60 * 24 * 7); // 7 days
      if (signedData?.signedUrl) {
        receiptUrl = signedData.signedUrl;
      }
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey) {
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: "منصة الأستاذ إسماعيل <onboarding@resend.dev>",
        to: [ADMIN_EMAIL],
        subject: `طلب اشتراك جديد: ${fullName}`,
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #2d6a4f;">طلب اشتراك جديد</h2>
            <table style="border-collapse: collapse; width: 100%;">
              <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">الطالب</td><td style="padding: 8px; border: 1px solid #ddd;">${fullName}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">الصف</td><td style="padding: 8px; border: 1px solid #ddd;">${grade}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">رقم المحوّل منه</td><td style="padding: 8px; border: 1px solid #ddd;">${senderPhone}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">رقم التحويل (المرجع)</td><td style="padding: 8px; border: 1px solid #ddd;">${transferNumber}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">المبلغ</td><td style="padding: 8px; border: 1px solid #ddd;">${amount} جنيه</td></tr>
            </table>
            ${receiptUrl 
              ? `<div style="margin-top: 20px;">
                  <h3 style="color: #2d6a4f;">صورة إيصال التحويل:</h3>
                  <a href="${receiptUrl}" target="_blank" style="color: #2754C5; text-decoration: underline;">اضغط هنا لعرض الإيصال</a>
                  <br/><br/>
                  <img src="${receiptUrl}" alt="إيصال التحويل" style="max-width: 100%; max-height: 500px; border: 1px solid #ddd; border-radius: 8px;" />
                </div>` 
              : '<p style="margin-top: 16px; color: #999;">لم يتم رفع إيصال</p>'}
          </div>
        `,
      });
    }

    console.log(`New subscription request processed: amount=${amount}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
