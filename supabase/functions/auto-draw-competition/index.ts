import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find competitions ready for auto-draw
    const now = new Date();
    const todayDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);

    const { data: competitions, error: fetchError } = await supabase
      .from("weekly_competitions")
      .select("*")
      .eq("status", "active")
      .eq("draw_type", "scheduled")
      .not("draw_date", "is", null);

    if (fetchError) {
      console.error("Error fetching competitions:", fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results: any[] = [];

    for (const comp of (competitions || [])) {
      // Check if draw time has passed
      const drawDateTime = new Date(`${comp.draw_date}T${comp.draw_time || '00:00'}:00`);
      if (drawDateTime > now) continue;

      // Get correct entries
      const { data: entries } = await supabase
        .from("competition_entries")
        .select("*")
        .eq("competition_id", comp.id)
        .eq("is_correct", true);

      if (!entries || entries.length === 0) {
        // No correct entries, mark as completed without winner
        await supabase
          .from("weekly_competitions")
          .update({ status: "completed" })
          .eq("id", comp.id);
        results.push({ competition: comp.title, result: "no_correct_entries" });
        continue;
      }

      // Filter subscribers only
      const userIds = [...new Set(entries.map((e: any) => e.user_id))];
      const { data: subscribedProfiles } = await supabase
        .from("profiles")
        .select("user_id")
        .in("user_id", userIds)
        .eq("is_subscribed", true);

      const subscribedUserIds = new Set((subscribedProfiles || []).map((p: any) => p.user_id));
      const eligibleEntries = entries.filter((e: any) => subscribedUserIds.has(e.user_id));

      if (eligibleEntries.length === 0) {
        await supabase
          .from("weekly_competitions")
          .update({ status: "completed" })
          .eq("id", comp.id);
        results.push({ competition: comp.title, result: "no_eligible_subscribers" });
        continue;
      }

      // Pick random winner
      const winner = eligibleEntries[Math.floor(Math.random() * eligibleEntries.length)];

      // Get winner profile
      const { data: winnerProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", winner.user_id)
        .single();

      const winnerName = winnerProfile?.full_name || "غير معروف";

      // Update competition
      await supabase
        .from("weekly_competitions")
        .update({
          status: "completed",
          winner_id: winner.user_id,
          winner_name: winnerName,
        })
        .eq("id", comp.id);

      // Send in-app notification
      await supabase.from("student_notifications").insert({
        user_id: winner.user_id,
        title: "🏆 مبروك! فزت في المسابقة الأسبوعية",
        body: `تهانينا! لقد فزت في "${comp.title}" 🎉 يمكنك الآن تحميل شهادة الفوز من صفحة الشهادات.`,
        type: "competition_winner",
      });

      // Send push notification
      const { data: pushSubs } = await supabase
        .from("push_subscriptions")
        .select("*")
        .eq("user_id", winner.user_id);

      if (pushSubs && pushSubs.length > 0) {
        const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
        const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

        if (vapidPublicKey && vapidPrivateKey) {
          // Invoke the existing push function
          await supabase.functions.invoke("send-push-notification", {
            body: {
              title: "🏆 مبروك! فزت في المسابقة",
              body: `تهانينا! فزت في "${comp.title}" 🎉 حمّل شهادتك الذهبية الآن!`,
              target_user_ids: [winner.user_id],
            },
          });
        }
      }

      results.push({ competition: comp.title, winner: winnerName, result: "drawn" });
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Auto-draw error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
