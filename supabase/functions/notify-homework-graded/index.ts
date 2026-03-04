import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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
      console.error("No auth header");
      return new Response(JSON.stringify({ error: "غير مصرح" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify user
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (!user || userError) {
      console.error("Auth error:", userError);
      return new Response(JSON.stringify({ error: "غير مصرح" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const body = await req.json();
    const { type, student_user_id, title, score, total } = body;
    console.log("Notify request:", { type, student_user_id, title, score });

    // Get student profile with parent phone
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("full_name, parent_phone, student_phone")
      .eq("user_id", student_user_id)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
    }

    if (!profile || !profile.parent_phone) {
      console.log("No parent phone found for user:", student_user_id);
      // Still create in-app notification
      await supabaseAdmin.from("student_notifications").insert({
        user_id: student_user_id,
        title: type === "homework_graded" ? "تم تصحيح واجبك" : "فيديو جديد",
        body: type === "homework_graded"
          ? `تم تصحيح واجب "${title}" وحصلت على ${score}/10`
          : `تم إضافة درس جديد: "${title}"`,
        type: type === "homework_graded" ? "homework_graded" : "new_video",
      });
      return new Response(JSON.stringify({ success: true, message: "لا يوجد رقم ولي أمر - تم إنشاء إشعار داخلي" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Format phone for WhatsApp
    let phone = profile.parent_phone.replace(/\s+/g, "").replace(/-/g, "");
    if (phone.startsWith("0")) phone = "2" + phone;
    if (!phone.startsWith("+")) phone = "+" + phone;
    console.log("Formatted phone:", phone);

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const fromPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!accountSid || !authToken || !fromPhone) {
      console.error("Twilio not configured:", { hasSid: !!accountSid, hasToken: !!authToken, hasPhone: !!fromPhone });
      // Still create in-app notification
      await supabaseAdmin.from("student_notifications").insert({
        user_id: student_user_id,
        title: type === "homework_graded" ? "تم تصحيح واجبك" : "فيديو جديد",
        body: type === "homework_graded"
          ? `تم تصحيح واجب "${title}" وحصلت على ${score}/10`
          : `تم إضافة درس جديد: "${title}"`,
        type: type === "homework_graded" ? "homework_graded" : "new_video",
      });
      return new Response(JSON.stringify({ success: true, message: "Twilio غير مهيأ - تم إنشاء إشعار داخلي" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let message = "";
    if (type === "homework_graded") {
      message = `📝 تم تصحيح واجب ابنكم/ابنتكم\n\nالطالب/ة: ${profile.full_name}\nالواجب: ${title}\nالدرجة: ${score}/10\n\nمنصة الأستاذ إسماعيل أحمد عبادة`;
    } else if (type === "new_video") {
      message = `🎬 فيديو جديد على المنصة\n\nتم إضافة درس جديد: "${title}"\n\nسارعوا بمشاهدته!\n\nمنصة الأستاذ إسماعيل أحمد عبادة`;
    }

    let whatsappSent = false;
    if (message) {
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const formData = new URLSearchParams({
        To: `whatsapp:${phone}`,
        From: `whatsapp:${fromPhone}`,
        Body: message,
      });

      console.log("Sending WhatsApp to:", `whatsapp:${phone}`, "from:", `whatsapp:${fromPhone}`);

      const twilioResponse = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      const twilioResult = await twilioResponse.json();
      console.log("Twilio response status:", twilioResponse.status);
      console.log("Twilio response body:", JSON.stringify(twilioResult));
      
      whatsappSent = twilioResponse.ok;
      if (!twilioResponse.ok) {
        console.error("Twilio error:", JSON.stringify(twilioResult));
      }
    }

    // Create in-app notification
    await supabaseAdmin.from("student_notifications").insert({
      user_id: student_user_id,
      title: type === "homework_graded" ? "تم تصحيح واجبك" : "فيديو جديد",
      body: type === "homework_graded"
        ? `تم تصحيح واجب "${title}" وحصلت على ${score}/10`
        : `تم إضافة درس جديد: "${title}"`,
      type: type === "homework_graded" ? "homework_graded" : "new_video",
    });

    return new Response(JSON.stringify({ success: true, whatsapp_sent: whatsappSent }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    console.error("Notify error:", err);
    return new Response(JSON.stringify({ error: "حدث خطأ", details: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
