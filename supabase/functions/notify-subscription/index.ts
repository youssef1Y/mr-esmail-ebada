import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const ADMIN_EMAIL = "esmail.ahmed590@gmail.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fullName, grade, senderPhone, transferNumber, amount, receiptUrl } = await req.json();

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
            ${receiptUrl ? `<p style="margin-top: 16px;"><a href="${receiptUrl}" style="color: #2d6a4f; font-weight: bold;">عرض إيصال التحويل</a></p>` : '<p style="margin-top: 16px; color: #999;">لم يتم رفع إيصال</p>'}
          </div>
        `,
      });
    }

    console.log(`New subscription request: ${fullName} - ${senderPhone} - ${transferNumber}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
