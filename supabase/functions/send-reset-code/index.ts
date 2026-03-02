import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone } = await req.json();

    if (!phone || typeof phone !== "string" || phone.length < 10 || phone.length > 15) {
      return new Response(
        JSON.stringify({ error: "رقم هاتف غير صالح" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check if user exists
    const email = `${phone}@ismail-ebada.platform`;
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error("Error listing users:", listError.message);
      return new Response(
        JSON.stringify({ error: "حدث خطأ، حاول مرة أخرى" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userExists = users.users.some((u: any) => u.email === email);
    if (!userExists) {
      return new Response(
        JSON.stringify({ error: "هذا الرقم غير مسجل في المنصة" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limit: max 1 OTP per phone per 2 minutes
    const { data: recentOtp } = await supabase
      .from("password_reset_otps")
      .select("created_at")
      .eq("phone", phone)
      .eq("used", false)
      .gt("created_at", new Date(Date.now() - 2 * 60 * 1000).toISOString())
      .limit(1)
      .single();

    if (recentOtp) {
      return new Response(
        JSON.stringify({ error: "تم إرسال كود بالفعل، انتظر دقيقتين قبل المحاولة مرة أخرى" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate 6-digit OTP
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Store OTP in database
    const { error: insertError } = await supabase
      .from("password_reset_otps")
      .insert({ phone, code, expires_at: expiresAt });

    if (insertError) {
      console.error("Error storing OTP:", insertError.message);
      return new Response(
        JSON.stringify({ error: "حدث خطأ، حاول مرة أخرى" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send SMS via Twilio
    const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!twilioSid || !twilioToken || !twilioPhone) {
      console.error("Twilio credentials not configured");
      return new Response(
        JSON.stringify({ error: "خدمة الرسائل غير متاحة حالياً" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format phone to E.164 (Egypt)
    let formattedPhone = phone;
    if (phone.startsWith("0")) {
      formattedPhone = "+2" + phone;
    } else if (!phone.startsWith("+")) {
      formattedPhone = "+2" + phone;
    }

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
    const smsBody = `كود استعادة كلمة المرور لمنصة الأستاذ إسماعيل أحمد عبادة: ${code}\nالكود صالح لمدة 10 دقائق.`;

    const smsResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": "Basic " + btoa(`${twilioSid}:${twilioToken}`),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: formattedPhone,
        From: twilioPhone,
        Body: smsBody,
      }),
    });

    if (!smsResponse.ok) {
      const smsError = await smsResponse.text();
      console.error("Twilio SMS error:", smsError);
      // Clean up the OTP since SMS failed
      await supabase.from("password_reset_otps").delete().eq("phone", phone).eq("code", code);
      return new Response(
        JSON.stringify({ error: "فشل في إرسال الرسالة، حاول مرة أخرى" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-reset-code:", error);
    return new Response(
      JSON.stringify({ error: "حدث خطأ غير متوقع" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
