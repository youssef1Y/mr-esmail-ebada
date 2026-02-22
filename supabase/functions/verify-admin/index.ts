import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const ADMIN_PHONE = "01097602493";
const ADMIN_PASSWORD = "Esmail01097602493";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, password } = await req.json();

    if (phone !== ADMIN_PHONE || password !== ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: "بيانات غير صحيحة" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Use service role to check/assign admin role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find user by email pattern
    const email = `${ADMIN_PHONE}@ismail-ebada.platform`;
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const adminUser = users?.users?.find(u => u.email === email);

    if (!adminUser) {
      return new Response(JSON.stringify({ error: "المستخدم غير موجود، سجل أولاً" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Ensure admin role exists
    const { data: existingRole } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", adminUser.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!existingRole) {
      await supabaseAdmin.from("user_roles").insert({
        user_id: adminUser.id,
        role: "admin",
      });
    }

    return new Response(JSON.stringify({ success: true, user_id: adminUser.id }), {
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
