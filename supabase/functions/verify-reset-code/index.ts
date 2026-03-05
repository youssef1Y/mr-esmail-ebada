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
    const { phone, code, new_password } = await req.json();

    // Validate inputs
    if (!phone || typeof phone !== "string" || phone.length < 10) {
      return new Response(
        JSON.stringify({ error: "رقم هاتف غير صالح" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!code || typeof code !== "string" || code.length !== 6) {
      return new Response(
        JSON.stringify({ error: "كود التحقق غير صالح" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!new_password || typeof new_password !== "string" || new_password.length < 6) {
      return new Response(
        JSON.stringify({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify OTP by calling the send-reset-code function's stored OTPs
    // Since edge functions don't share memory, we need a different approach
    // We'll use a database table to store OTPs
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check OTP from database
    const { data: otpRecord, error: otpError } = await supabase
      .from("password_reset_otps")
      .select("*")
      .eq("phone", phone)
      .eq("code", code)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (otpError || !otpRecord) {
      // Track failed attempts - find the latest OTP for this phone
      const { data: latestOtp } = await supabase
        .from("password_reset_otps")
        .select("id, attempt_count")
        .eq("phone", phone)
        .eq("used", false)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (latestOtp) {
        const newCount = (latestOtp.attempt_count || 0) + 1;
        if (newCount >= 5) {
          // Invalidate OTP after 5 failed attempts
          await supabase
            .from("password_reset_otps")
            .update({ used: true, attempt_count: newCount })
            .eq("id", latestOtp.id);
        } else {
          await supabase
            .from("password_reset_otps")
            .update({ attempt_count: newCount })
            .eq("id", latestOtp.id);
        }
      }

      return new Response(
        JSON.stringify({ error: "كود التحقق غير صحيح أو منتهي الصلاحية" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if max attempts reached
    if (otpRecord.attempt_count >= 5) {
      return new Response(
        JSON.stringify({ error: "تم تجاوز عدد المحاولات المسموح. اطلب كود جديد." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark OTP as used
    await supabase
      .from("password_reset_otps")
      .update({ used: true })
      .eq("id", otpRecord.id);

    // Find user and update password
    const email = `${phone}@ismail-ebada.platform`;
    const { data: { users }, error: lookupError } = await supabase.auth.admin.listUsers({ filter: email });
    const user = users?.find((u: any) => u.email === email);

    if (lookupError || !user) {
      return new Response(
        JSON.stringify({ error: "لم يتم العثور على حساب مرتبط بهذا الرقم" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: new_password }
    );

    if (updateError) {
      console.error("Error updating password:", updateError.message);
      return new Response(
        JSON.stringify({ error: "فشل في تحديث كلمة المرور" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean up old OTPs for this phone
    await supabase
      .from("password_reset_otps")
      .delete()
      .eq("phone", phone);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in verify-reset-code:", error);
    return new Response(
      JSON.stringify({ error: "حدث خطأ غير متوقع" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
