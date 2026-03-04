import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "npm:resend@4.0.0";

const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "esmail.ahmed590@gmail.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
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

    const { fullName, grade, studentPhone, school, governorate, madhab } = await req.json();

    // Validate required fields
    if (!fullName || !grade || !studentPhone) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

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

    console.log(`New registration processed: grade=${grade}`);

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
