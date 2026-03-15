import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUMMARY_KEYWORDS = ["لخص", "تلخيص", "ملخص", "لخصلي", "لخصهولي", "لخصه", "summary", "summarize", "لخصلى", "لخصهولى"];

function isSummaryRequest(messages: any[]): boolean {
  const last = messages?.[messages.length - 1];
  if (!last || last.role !== "user") return false;
  const t = last.content.toLowerCase();
  return SUMMARY_KEYWORDS.some(k => t.includes(k));
}

function norm(text: string): string {
  return (text || "").toLowerCase().replace(/[أإآ]/g, "ا").replace(/ى/g, "ي")
    .replace(/[\u064B-\u065F]/g, "").replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}

function findTargetVideo(msg: string, videos: any[], watchedIds: string[], lastWatchedId: string | null) {
  if (!videos?.length) return null;
  const n = norm(msg);
  const watched = new Set(watchedIds);

  const score = (v: any) => {
    const t = norm(v.title || "");
    if (!t) return 0;
    if (n.includes(t)) return 4;
    const words = t.split(" ").filter((w: string) => w.length > 2);
    const hits = words.filter((w: string) => n.includes(w)).length;
    return hits >= 2 ? 3 : hits === 1 ? 2 : 0;
  };

  const watchedVids = videos.filter((v: any) => watched.has(v.id));
  const best = (list: any[]) => list.map((v: any) => ({ v, s: score(v) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s)[0]?.v;

  return best(watchedVids) || best(videos) || (lastWatchedId ? videos.find((v: any) => v.id === lastWatchedId) : null) || watchedVids[0] || null;
}

function sseResponse(text: string): Response {
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    start(c) {
      // Stream in chunks for faster first-byte
      const chunks = text.match(/.{1,200}/gs) || [text];
      for (const chunk of chunks) {
        c.enqueue(enc.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: chunk } }] })}\n\n`));
      }
      c.enqueue(enc.encode("data: [DONE]\n\n"));
      c.close();
    },
  });
  return new Response(stream, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const token = (req.headers.get("authorization") ?? "").replace("Bearer ", "");
    const supabaseUser = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: userErr } = await supabaseUser.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "غير مصرح" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { messages, action, video_id } = await req.json();

    // Direct video summary action
    if (action === "summarize_video" && video_id) {
      const { data: vc } = await admin.from("video_views").select("id").eq("user_id", user.id).eq("video_id", video_id).limit(1);
      if (!vc?.length) {
        return new Response(JSON.stringify({ error: "لازم تشوف الفيديو الأول" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const r = await fetch(`${SUPABASE_URL}/functions/v1/summarize-video`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", apikey: ANON_KEY },
        body: JSON.stringify({ video_id }),
      });
      return new Response(JSON.stringify(await r.json()), {
        status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Parallel data fetch (all at once) ──
    const [profileRes, viewsRes, rankRes, homeworkRes, examRes, scheduleRes, pointsRes, keysRes, summariesRes, memoryRes] = await Promise.all([
      admin.from("profiles").select("full_name, grade, is_subscribed, madhab, subscription_expires_at").eq("user_id", user.id).single(),
      admin.from("video_views").select("video_id, viewed_at").eq("user_id", user.id).order("viewed_at", { ascending: false }).limit(50),
      admin.rpc("get_student_rank", { p_user_id: user.id }),
      admin.from("homework").select("title, subject, due_date").order("created_at", { ascending: false }).limit(5),
      admin.from("exam_attempts").select("score, total, submitted_at, exams(title, subject)").eq("user_id", user.id).order("submitted_at", { ascending: false }).limit(5),
      admin.from("schedule_events").select("title, event_date, event_time, subject").gte("event_date", new Date().toISOString().split("T")[0]).order("event_date", { ascending: true }).limit(5),
      admin.from("student_points").select("points, reason, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
      admin.from("student_keys").select("keys_count").eq("user_id", user.id).single(),
      admin.from("video_summaries").select("video_id, summary"),
      admin.from("chat_memory").select("memory").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
    ]);

    const profile = profileRes.data;
    const views = viewsRes.data || [];
    const watchedIds = [...new Set(views.map((v: any) => v.video_id))];
    const lastWatchedId = views[0]?.video_id ?? null;
    const rank = rankRes.data?.[0] || { rank: 0, total_points: 0, total_students: 0 };
    const summariesMap = new Map((summariesRes.data || []).map((s: any) => [s.video_id, s.summary]));
    const name = profile?.full_name || "الطالب";
    const first = name.split(" ")[0];
    const memories = (memoryRes.data || []).map((m: any) => m.memory);

    // Fetch videos for grade (needed for both summary and context)
    const { data: gradeVideos } = await admin
      .from("videos").select("id, title, subject").eq("grade", profile?.grade || "")
      .order("created_at", { ascending: false }).limit(30);

    // ── Summary request → deterministic fast path ──
    if (isSummaryRequest(messages || [])) {
      const lastMsg = messages[messages.length - 1]?.content || "";
      const target = findTargetVideo(lastMsg, gradeVideos || [], watchedIds, lastWatchedId);

      if (!target) return sseResponse(`يا ${first} 😊 اكتب اسم الدرس اللي عايز تلخيصه أو قول: لخصلي آخر درس شفته.`);
      if (!watchedIds.includes(target.id)) return sseResponse(`لسه مشوفتش الفيديو ده يا ${first}! روح اتفرج عليه الأول وبعدين ارجعلي ألخصهولك 😊`);

      let summary = summariesMap.get(target.id) || null;
      if (!summary) {
        try {
          const r = await fetch(`${SUPABASE_URL}/functions/v1/summarize-video`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", apikey: ANON_KEY },
            body: JSON.stringify({ video_id: target.id }),
          });
          if (r.ok) { const d = await r.json(); summary = d?.summary || null; }
        } catch (e) { console.error("Summary err:", e); }
      }

      if (!summary) return sseResponse(`للأسف معرفتش ألخص الفيديو ده دلوقتي يا ${first}، جرّب تاني بعد شوية.`);

      // Save memory about this interaction
      admin.from("chat_memory").insert({ user_id: user.id, memory: `الطالب طلب تلخيص فيديو "${target.title}" (${target.subject})` }).then();

      return sseResponse(`أكيد يا ${first} 💙\n\n**ملخص فيديو "${target.title}"**\n\n${summary}`);
    }

    // ── Build compact context for AI ──
    const videoList = (gradeVideos || []).map((v: any) => {
      const w = watchedIds.includes(v.id);
      return `- ${v.title} (${v.subject}) [${w ? "✅" : "❌"}]`;
    }).join("\n");

    const hw = (homeworkRes.data || []).map((h: any) => `- ${h.title} (${h.subject})${h.due_date ? ` ${new Date(h.due_date).toLocaleDateString("ar-EG")}` : ""}`).join("\n") || "لا يوجد";
    const exams = (examRes.data || []).map((e: any) => `- ${(e as any).exams?.title || "امتحان"}: ${e.score}/${e.total}`).join("\n") || "لا يوجد";
    const sched = (scheduleRes.data || []).map((s: any) => `- ${s.title} ${s.event_date}${s.event_time ? " " + s.event_time : ""}`).join("\n") || "لا يوجد";
    const pts = (pointsRes.data || []).slice(0, 5).map((p: any) => `${p.points > 0 ? "+" : ""}${p.points}: ${p.reason}`).join("\n");

    const memoryContext = memories.length > 0 ? `\n# ذاكرة المحادثات السابقة:\n${memories.map(m => `- ${m}`).join("\n")}` : "";

    const systemPrompt = `أنت "مساعد المنصة" 🎓 لمنصة الأستاذ إسماعيل أحمد عباده.
رد بسرعة وبإيجاز. نادِ الطالب "${first}". رد بنفس لهجته. كن ودود ومحفز. إيموجي باعتدال.

# الطالب: ${name} | ${profile?.grade || "؟"} | ${profile?.madhab || "؟"} | ${profile?.is_subscribed ? "مشترك ✅" : "غير مشترك ❌"}
النقاط: ${rank.total_points} | الترتيب: ${rank.rank}/${rank.total_students} | المفاتيح: ${keysRes.data?.keys_count ?? 0}
${memoryContext}
# النقاط: مشاهدة=+1 | واجب=2-8 | امتحان=2-10 | دعوة صديق=مفتاح
المستويات: 🌱0-49 📖50-149 ⭐150-299 🏅300-499 👑500-799 💎800-1199 🏆1200+
${pts ? `آخر النقاط:\n${pts}` : ""}

# الفيديوهات (✅=شاهد ❌=لم يشاهد):
${videoList || "لا يوجد"}

# الواجبات: ${hw}
# الامتحانات: ${exams}
# الجدول: ${sched}

# ممنوعات: ❌ إجابات الامتحانات/الواجبات. اشرح المفهوم فقط.
لو طلب تلخيص: قله "اكتب: لخصلي + اسم الدرس"`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "كثرت الأسئلة 😅 استنى شوية" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "الخدمة غير متاحة حالياً" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      console.error("AI error:", status, await response.text());
      return new Response(JSON.stringify({ error: "حصل خطأ، حاول تاني" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Save memory about what student asked (fire-and-forget)
    const lastUserMsg = messages?.[messages.length - 1]?.content || "";
    if (lastUserMsg.length > 5) {
      admin.from("chat_memory").insert({
        user_id: user.id,
        memory: `سأل: "${lastUserMsg.slice(0, 100)}"`,
      }).then();
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
