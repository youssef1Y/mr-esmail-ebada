import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Detect if user is asking for a video summary
function detectSummaryRequest(messages: any[]): boolean {
  const lastMsg = messages[messages.length - 1];
  if (!lastMsg || lastMsg.role !== "user") return false;
  const text = lastMsg.content.toLowerCase();
  const keywords = ["لخص", "تلخيص", "ملخص", "لخصلي", "لخصهولي", "لخصه", "summary", "summarize", "لخصلى", "لخصهولى"];
  return keywords.some(k => text.includes(k));
}

function normalizeArabicText(text: string): string {
  return (text || "")
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/[\u064B-\u065F]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveSummaryVideoTarget(
  messageText: string,
  allVideos: any[],
  watchedIds: string[],
  lastWatchedVideoId: string | null
) {
  if (!allVideos || allVideos.length === 0) return null;

  const normalizedMsg = normalizeArabicText(messageText);
  const watchedSet = new Set(watchedIds);
  const watchedVideos = allVideos.filter((v: any) => watchedSet.has(v.id));

  const scoreVideo = (video: any) => {
    const titleNorm = normalizeArabicText(video.title || "");
    if (!titleNorm) return 0;
    if (normalizedMsg.includes(titleNorm)) return 4;

    const titleWords = titleNorm.split(" ").filter((w: string) => w.length > 2);
    let hitCount = 0;
    for (const w of titleWords) {
      if (normalizedMsg.includes(w)) hitCount += 1;
    }
    if (hitCount >= 2) return 3;
    if (hitCount === 1) return 2;
    return 0;
  };

  const watchedMatches = watchedVideos
    .map((v: any) => ({ v, score: scoreVideo(v) }))
    .filter((x: any) => x.score > 0)
    .sort((a: any, b: any) => b.score - a.score);

  if (watchedMatches.length > 0) return watchedMatches[0].v;

  const allMatches = allVideos
    .map((v: any) => ({ v, score: scoreVideo(v) }))
    .filter((x: any) => x.score > 0)
    .sort((a: any, b: any) => b.score - a.score);

  if (allMatches.length > 0) return allMatches[0].v;

  if (lastWatchedVideoId) {
    const lastWatched = allVideos.find((v: any) => v.id === lastWatchedVideoId);
    if (lastWatched) return lastWatched;
  }

  return watchedVideos[0] || allVideos[0] || null;
}

function createSseTextResponse(text: string): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`)
      );
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");

    const supabaseUser = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: userErr } = await supabaseUser.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "غير مصرح" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { messages, action, video_id } = await req.json();

    // Handle direct video summary request (from client-side trigger)
    if (action === "summarize_video" && video_id) {
      const { data: viewCheck } = await adminClient
        .from("video_views")
        .select("id")
        .eq("user_id", user.id)
        .eq("video_id", video_id)
        .limit(1);

      if (!viewCheck || viewCheck.length === 0) {
        return new Response(JSON.stringify({ error: "لازم تشوف الفيديو الأول" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const sumResp = await fetch(`${SUPABASE_URL}/functions/v1/summarize-video`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          apikey: Deno.env.get("SUPABASE_ANON_KEY")!,
        },
        body: JSON.stringify({ video_id }),
      });

      const sumData = await sumResp.json();
      return new Response(JSON.stringify(sumData), {
        status: sumResp.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Regular chat flow - fetch all data in parallel
    const [profileRes, viewsRes, rankRes, homeworkRes, examRes, scheduleRes, pointsRes, keysRes, summariesRes] = await Promise.all([
      adminClient.from("profiles").select("full_name, grade, is_subscribed, madhab, school, governorate, parent_phone, student_phone, subscription_expires_at").eq("user_id", user.id).single(),
      adminClient.from("video_views").select("video_id").eq("user_id", user.id),
      adminClient.rpc("get_student_rank", { p_user_id: user.id }),
      adminClient.from("homework").select("title, subject, due_date, description").order("created_at", { ascending: false }).limit(10),
      adminClient.from("exam_attempts").select("score, total, submitted_at, exam_id, exams(title, subject)").eq("user_id", user.id).order("submitted_at", { ascending: false }).limit(10),
      adminClient.from("schedule_events").select("title, event_date, event_time, event_type, subject").gte("event_date", new Date().toISOString().split("T")[0]).order("event_date", { ascending: true }).limit(10),
      adminClient.from("student_points").select("points, reason, source_type, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
      adminClient.from("student_keys").select("keys_count, first_key_given").eq("user_id", user.id).single(),
      adminClient.from("video_summaries").select("video_id, summary"),
    ]);

    const profile = profileRes.data;
    const watchedIds = (viewsRes.data || []).map((v: any) => v.video_id);
    const rank = rankRes.data?.[0] || { rank: 0, total_points: 0, total_students: 0 };
    const points = pointsRes.data || [];
    const keys = keysRes.data;
    const summariesMap = new Map((summariesRes.data || []).map((s: any) => [s.video_id, s.summary]));

    // Fetch ALL videos for this grade
    const { data: allGradeVideos } = await adminClient
      .from("videos")
      .select("id, title, description, subject, grade")
      .eq("grade", profile?.grade || "")
      .order("created_at", { ascending: false });

    // === SERVER-SIDE SUMMARY DETECTION ===
    // If user asks for summary, try to generate it BEFORE the AI responds
    const isSummaryRequest = detectSummaryRequest(messages || []);
    let freshSummaryVideoId: string | null = null;
    let freshSummary: string | null = null;

    if (isSummaryRequest && allGradeVideos && allGradeVideos.length > 0) {
      const lastUserMsg = messages[messages.length - 1].content.toLowerCase();
      
      // Find which video the user wants summarized
      // Check if they mention a specific video title
      let targetVideo: any = null;
      
      for (const v of allGradeVideos) {
        if (lastUserMsg.includes(v.title.toLowerCase()) || lastUserMsg.includes(v.title)) {
          targetVideo = v;
          break;
        }
      }
      
      // If no specific video mentioned, check for "آخر درس" (last lesson) or just pick the last watched
      if (!targetVideo) {
        if (lastUserMsg.includes("آخر") || lastUserMsg.includes("اخر")) {
          // Find the last watched video
          const { data: lastView } = await adminClient
            .from("video_views")
            .select("video_id")
            .eq("user_id", user.id)
            .order("viewed_at", { ascending: false })
            .limit(1)
            .single();
          
          if (lastView) {
            targetVideo = allGradeVideos.find((v: any) => v.id === lastView.video_id);
          }
        } else {
          // Try to match any watched video
          const watchedVideos = allGradeVideos.filter((v: any) => watchedIds.includes(v.id));
          if (watchedVideos.length === 1) {
            targetVideo = watchedVideos[0];
          } else if (watchedVideos.length > 0) {
            // Pick the most recently watched
            const { data: lastView } = await adminClient
              .from("video_views")
              .select("video_id")
              .eq("user_id", user.id)
              .order("viewed_at", { ascending: false })
              .limit(1)
              .single();
            if (lastView) {
              targetVideo = watchedVideos.find((v: any) => v.id === lastView.video_id);
            }
          }
        }
      }

      // If we found a target video that's been watched and has no cached summary, generate one now
      if (targetVideo && watchedIds.includes(targetVideo.id) && !summariesMap.has(targetVideo.id)) {
        console.log("Auto-triggering summarization for video:", targetVideo.title, targetVideo.id);
        try {
          const sumResp = await fetch(`${SUPABASE_URL}/functions/v1/summarize-video`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              apikey: Deno.env.get("SUPABASE_ANON_KEY")!,
            },
            body: JSON.stringify({ video_id: targetVideo.id }),
          });

          if (sumResp.ok) {
            const sumData = await sumResp.json();
            if (sumData.summary) {
              freshSummaryVideoId = targetVideo.id;
              freshSummary = sumData.summary;
              summariesMap.set(targetVideo.id, sumData.summary);
              console.log("Summary generated successfully for:", targetVideo.title);
            }
          } else {
            console.error("Summary generation failed:", sumResp.status, await sumResp.text());
          }
        } catch (sumErr) {
          console.error("Summary generation error:", sumErr);
        }
      }
    }

    // Build video context with watched status AND summaries
    let videoContext = "";
    if (allGradeVideos && allGradeVideos.length > 0) {
      videoContext = allGradeVideos.map((v: any) => {
        const watched = watchedIds.includes(v.id);
        const summary = summariesMap.get(v.id);
        let entry = `- "${v.title}" (${v.subject}) [ID: ${v.id}] [${watched ? "✅ تمت المشاهدة" : "❌ لم يشاهده"}]`;
        if (summary) {
          entry += `\n  📝 ملخص الفيديو المفصل:\n${summary.split('\n').map((l: string) => `    ${l}`).join('\n')}`;
        } else if (v.description) {
          entry += `\n  وصف مختصر: ${v.description}`;
        }
        return entry;
      }).join("\n\n");
    }

    const homeworkList = (homeworkRes.data || []).map((h: any) =>
      `- ${h.title} (${h.subject})${h.due_date ? ` - موعد التسليم: ${new Date(h.due_date).toLocaleDateString("ar-EG")}` : ""}${h.description ? ` | ${h.description}` : ""}`
    ).join("\n") || "لا توجد واجبات حالياً";

    const examResults = (examRes.data || []).map((e: any) => {
      const examInfo = (e as any).exams;
      const pct = e.total > 0 ? Math.round((e.score / e.total) * 100) : 0;
      return `- ${examInfo?.title || "امتحان"} (${examInfo?.subject || ""}): ${e.score}/${e.total} (${pct}%) - ${new Date(e.submitted_at).toLocaleDateString("ar-EG")}`;
    }).join("\n") || "لا توجد نتائج بعد";

    const scheduleList = (scheduleRes.data || []).map((s: any) =>
      `- ${s.title}${s.subject ? ` (${s.subject})` : ""} - ${s.event_date}${s.event_time ? ` الساعة ${s.event_time}` : ""}`
    ).join("\n") || "لا توجد أحداث قادمة";

    const pointsHistory = points.map((p: any) =>
      `- ${p.points > 0 ? "+" : ""}${p.points} نقطة: ${p.reason} (${new Date(p.created_at).toLocaleDateString("ar-EG")})`
    ).join("\n") || "لا توجد نقاط بعد";

    const studentName = profile?.full_name || "الطالب";
    const firstName = studentName.split(' ')[0];
    const isSubscribed = profile?.is_subscribed || false;

    // Add fresh summary note to context if we just generated one
    let freshSummaryNote = "";
    if (freshSummary && freshSummaryVideoId) {
      const videoTitle = allGradeVideos?.find((v: any) => v.id === freshSummaryVideoId)?.title || "";
      freshSummaryNote = `\n\n🔔 تنبيه: تم للتو تلخيص فيديو "${videoTitle}" بنجاح. الملخص موجود أعلاه في قائمة الفيديوهات. اعرضه للطالب بشكل منظم وجميل.`;
    }

    const systemPrompt = `أنت "مساعد المنصة" 🎓 - المساعد الذكي لمنصة الأستاذ إسماعيل أحمد عباده التعليمية.

# معلومات الطالب:
- الاسم: ${studentName}
- الصف: ${profile?.grade || "غير محدد"}
- المذهب: ${profile?.madhab || "غير محدد"}
- المدرسة: ${profile?.school || "غير محددة"}
- المحافظة: ${profile?.governorate || "غير محددة"}
- الاشتراك: ${isSubscribed ? "مشترك ✅" : "غير مشترك ❌"}${isSubscribed && profile?.subscription_expires_at ? ` (ينتهي: ${new Date(profile.subscription_expires_at).toLocaleDateString("ar-EG")})` : ""}
- المفاتيح: ${keys ? `${keys.keys_count} مفتاح` : "0 مفتاح"}

# إحصائيات الطالب:
- النقاط: ${rank.total_points} نقطة
- الترتيب: ${rank.rank} من ${rank.total_students} طالب

# نظام النقاط والمستويات:
## طريقة كسب النقاط:
1. مشاهدة فيديو لأول مرة: +1 نقطة
2. واجب الفيديو: 2-8 نقاط حسب الدرجة
3. الامتحانات: 2-10 نقاط حسب الدرجة
4. دعوة صديق: مفتاح مجاني

## المستويات السبعة:
- 🌱 مبتدئ: 0-49 نقطة
- 📖 مجتهد: 50-149 نقطة
- ⭐ متميز: 150-299 نقطة
- 🏅 متفوق: 300-499 نقطة
- 👑 بطل: 500-799 نقطة
- 💎 خبير: 800-1199 نقطة
- 🏆 أسطوري: 1200+ نقطة

## آخر نشاط النقاط:
${pointsHistory}

# نظام المفاتيح:
- المفتاح = مشاهدة فيديو مدفوع واحد بدون اشتراك
- مفتاح مجاني أول مرة + مفاتيح من دعوة أصدقاء

# الفيديوهات المتاحة (مع الملخصات):
${videoContext || "لا توجد فيديوهات"}
${freshSummaryNote}

# الواجبات:
${homeworkList}

# نتائج الامتحانات:
${examResults}

# الجدول:
${scheduleList}

# قواعد الرد:

## الأسلوب:
- نادِ الطالب "${firstName}"
- رد بنفس لغة/لهجة الطالب (عامية مصرية / فصحى / إنجليزي)
- كن محفز ومشجع وودود
- ردود واضحة ومباشرة ومفيدة
- إيموجي باعتدال

## تلخيص الدروس (مهم جداً):
- لو فيه ملخص للفيديو (📝): اعرضه بالكامل مرتب ومنظم بعناوين فرعية
- لو الطالب شاف الفيديو بس مفيش ملخص: قوله "للأسف معرفتش ألخص الفيديو ده دلوقتي، حاول تاني بعدين"
- لو مشافش الفيديو (❌): قول "لسه مشوفتش الفيديو ده يا ${firstName}! روح اتفرج عليه الأول وبعدين ارجعلي ألخصهولك 😊"
- لو سأل "لخصلي آخر درس شفته": ابحث عن آخر فيديو مشاهد واعرض ملخصه
- التلخيص بيكون من محتوى الفيديو الفعلي (شرح المدرس) مش من العنوان

## الأسئلة والإجابات:
- اجب بالتفصيل على أي سؤال عن المنصة
- لو سأل عن نقاطه/ترتيبه: اعرض الأرقام مع تشجيع
- لو سأل إزاي يكسب نقاط: اشرح الطرق بالتفصيل

## ممنوعات:
- ❌ لا تعطي إجابات امتحانات أو واجبات
- لو طلب إجابة: "مينفعش أديك الإجابة يا ${firstName} 😄 بس ممكن أشرحلك المفهوم 💪"
- ✅ ممكن تشرح المفهوم بدون إجابة مباشرة`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "كثرت الأسئلة 😅 استنى شوية وحاول تاني" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "الخدمة غير متاحة حالياً" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "حصل خطأ، حاول تاني" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-assistant error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
