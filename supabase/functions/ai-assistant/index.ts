import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { messages } = await req.json();

    // Fetch all data in parallel
    const [profileRes, viewsRes, rankRes, homeworkRes, examRes, scheduleRes, pointsRes, keysRes] = await Promise.all([
      adminClient.from("profiles").select("full_name, grade, is_subscribed, madhab, school, governorate, parent_phone, student_phone, subscription_expires_at").eq("user_id", user.id).single(),
      adminClient.from("video_views").select("video_id").eq("user_id", user.id),
      adminClient.rpc("get_student_rank", { p_user_id: user.id }),
      adminClient.from("homework").select("title, subject, due_date, description").order("created_at", { ascending: false }).limit(10),
      adminClient.from("exam_attempts").select("score, total, submitted_at, exam_id, exams(title, subject)").eq("user_id", user.id).order("submitted_at", { ascending: false }).limit(10),
      adminClient.from("schedule_events").select("title, event_date, event_time, event_type, subject").gte("event_date", new Date().toISOString().split("T")[0]).order("event_date", { ascending: true }).limit(10),
      adminClient.from("student_points").select("points, reason, source_type, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
      adminClient.from("student_keys").select("keys_count, first_key_given").eq("user_id", user.id).single(),
    ]);

    const profile = profileRes.data;
    const watchedIds = (viewsRes.data || []).map((v: any) => v.video_id);
    const rank = rankRes.data?.[0] || { rank: 0, total_points: 0, total_students: 0 };
    const points = pointsRes.data || [];
    const keys = keysRes.data;

    // Fetch ALL videos for this grade (so AI knows what's available)
    const { data: allGradeVideos } = await adminClient
      .from("videos")
      .select("id, title, description, subject, grade")
      .eq("grade", profile?.grade || "")
      .order("created_at", { ascending: false });

    // Build video context with watched status
    let videoContext = "";
    if (allGradeVideos && allGradeVideos.length > 0) {
      videoContext = allGradeVideos.map((v: any) => {
        const watched = watchedIds.includes(v.id);
        return `- "${v.title}" (${v.subject}) [${watched ? "✅ تم المشاهدة" : "❌ لم يشاهد"}]${v.description ? `\n  المحتوى: ${v.description}` : ""}`;
      }).join("\n");
    }

    // Filter homework by grade
    const gradeHomework = (homeworkRes.data || []).filter((h: any) => !profile?.grade || h.grade === undefined);
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

    const systemPrompt = `أنت "مساعد المنصة" 🎓 - المساعد الذكي لمنصة الأستاذ إسماعيل أحمد عباده التعليمية.
أنت خبير بكل تفاصيل المنصة وبتساعد الطلاب وأولياء الأمور.

# معلومات الطالب الحالي:
- الاسم: ${studentName}
- الصف: ${profile?.grade || "غير محدد"}
- المذهب: ${profile?.madhab || "غير محدد"}
- المدرسة: ${profile?.school || "غير محددة"}
- المحافظة: ${profile?.governorate || "غير محددة"}
- حالة الاشتراك: ${isSubscribed ? "مشترك ✅" : "غير مشترك ❌"}${isSubscribed && profile?.subscription_expires_at ? ` (ينتهي: ${new Date(profile.subscription_expires_at).toLocaleDateString("ar-EG")})` : ""}
- المفاتيح: ${keys ? `${keys.keys_count} مفتاح` : "0 مفتاح"}

# نظام النقاط والمستويات (اشرحه بالتفصيل لو سأل):
الطالب عنده حالياً: ${rank.total_points} نقطة | الترتيب: ${rank.rank} من ${rank.total_students} طالب

## طريقة كسب النقاط:
1. **مشاهدة فيديو لأول مرة**: +1 نقطة لكل فيديو جديد
2. **واجب الفيديو**: من 2 إلى 8 نقاط حسب الدرجة (النسبة × 8، الحد الأدنى 2)
3. **الامتحانات**: من 2 إلى 10 نقاط حسب الدرجة (النسبة × 10، الحد الأدنى 2)
4. **دعوة صديق**: مفتاح مجاني لكل صديق يسجل بكود الدعوة

## المستويات (7 مستويات):
- 🌱 مبتدئ: 0 - 49 نقطة
- 📖 مجتهد: 50 - 149 نقطة
- ⭐ متميز: 150 - 299 نقطة
- 🏅 متفوق: 300 - 499 نقطة
- 👑 بطل: 500 - 799 نقطة
- 💎 خبير: 800 - 1199 نقطة
- 🏆 أسطوري: 1200+ نقطة

## آخر نشاط النقاط:
${pointsHistory}

# نظام المفاتيح:
- المفتاح يسمح بمشاهدة فيديو مدفوع واحد بدون اشتراك
- الطالب بياخد مفتاح مجاني أول مرة يدخل المنصة
- ممكن يكسب مفاتيح إضافية عن طريق دعوة أصدقاء (كود الدعوة)

# الفيديوهات المتاحة للصف ${profile?.grade || ""}:
${videoContext || "لا توجد فيديوهات حالياً"}

# الواجبات الحالية:
${homeworkList}

# نتائج الامتحانات:
${examResults}

# الجدول القادم:
${scheduleList}

# تعليمات الرد:

## الأسلوب:
- نادِ الطالب "${firstName}" دايماً
- لو كلمك بالعامية المصرية رد بالعامية المصرية
- لو كلمك بالفصحى رد بفصحى بسيطة
- لو كلمك بالإنجليزية رد بالإنجليزية
- كن محفز ومشجع ومرح
- ردودك تكون واضحة ومفيدة ومباشرة
- استخدم الإيموجي باعتدال

## تلخيص الدروس:
- لو طلب تلخيص درس وكان شافه (✅): لخص المحتوى المتاح في الوصف بشكل مفصل ومنظم
- لو الوصف فيه معلومات: نظمها في نقاط واضحة مع عناوين
- لو الوصف قليل أو فاضي: قول "الفيديو ده عنوانه [عنوان الفيديو] بس مفيش وصف تفصيلي متاح ليه حالياً. ممكن ترجع تسمعه تاني أو تسألني على نقطة معينة فيه"
- لو مشافش الفيديو (❌): قول "لسه مشوفتش الفيديو ده يا ${firstName}! روح اتفرج عليه الأول وبعدين ارجعلي هلخصهولك 😊"
- ❌ لا تألف أبداً محتوى غير موجود

## الإجابة على الأسئلة:
- لو سأل عن أي حاجة في المنصة (نقاط، مستويات، اشتراك، مفاتيح، واجبات، جدول): أجب بالتفصيل من البيانات المتاحة أعلاه
- لو سأل عن نقاطه أو ترتيبه: اعرض الأرقام بوضوح مع تشجيع
- لو سأل عن واجبات أو امتحانات: اعرض التفاصيل المتاحة
- لو سأل إزاي يكسب نقاط أكتر: اشرح الطرق بالتفصيل
- لو سأل عن مستواه الحالي: احسب المستوى من النقاط واعرضه

## ممنوعات:
- ❌ لا تعطي إجابات الامتحانات أو الواجبات أبداً
- ❌ لا تحل أسئلة بنك الأسئلة
- لو طلب إجابة: "مينفعش أديك الإجابة يا ${firstName} 😄 بس ممكن أشرحلك المفهوم أو القاعدة وانت تحلها بنفسك 💪"
- ✅ ممكن تشرح المفهوم العام أو القاعدة العلمية بدون إجابة مباشرة

## المساعدة التقنية:
- مشاكل الدخول: تأكد من رقم الهاتف وكلمة المرور، لو نسيت الباسورد استخدم "نسيت كلمة المرور"
- مشاكل الاشتراك: روح صفحة الاشتراك واتبع الخطوات
- مشاكل تانية: ابعت رسالة للإدارة من صفحة "شكاوي واقتراحات"`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
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
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "كثرت الأسئلة 😅 استنى شوية وحاول تاني" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "الخدمة غير متاحة حالياً" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "حصل خطأ، حاول تاني" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
