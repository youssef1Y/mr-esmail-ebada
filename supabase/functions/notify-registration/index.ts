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
    const { fullName, grade, studentPhone, school, governorate, madhab } = await req.json();

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey) {
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: "منصة الأستاذ إسماعيل <onboarding@resend.dev>",
        to: [ADMIN_EMAIL],
        subject: `تسجيل طالب جديد: ${fullName}`,
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #2d6a4f;">تسجيل طالب جديد في المنصة</h2>
            <table style="border-collapse: collapse; width: 100%;">
              <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">الاسم</td><td style="padding: 8px; border: 1px solid #ddd;">${fullName}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">الصف</td><td style="padding: 8px; border: 1px solid #ddd;">${grade}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">رقم الهاتف</td><td style="padding: 8px; border: 1px solid #ddd;">${studentPhone}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">المدرسة</td><td style="padding: 8px; border: 1px solid #ddd;">${school || "غير محدد"}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">المحافظة</td><td style="padding: 8px; border: 1px solid #ddd;">${governorate || "غير محدد"}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">المذهب</td><td style="padding: 8px; border: 1px solid #ddd;">${madhab || "غير محدد"}</td></tr>
            </table>
          </div>
        `,
      });
    }

    console.log(`New registration: ${fullName} - ${grade} - ${studentPhone}`);

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
