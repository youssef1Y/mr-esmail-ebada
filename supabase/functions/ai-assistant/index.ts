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

    // Fetch student profile
    const { data: profile } = await adminClient
      .from("profiles")
      .select("full_name, grade, is_subscribed, madhab, school, governorate, parent_phone, student_phone")
      .eq("user_id", user.id)
      .single();

    // Fetch watched videos
    const { data: views } = await adminClient
      .from("video_views")
      .select("video_id")
      .eq("user_id", user.id);
    const watchedIds = (views || []).map((v: any) => v.video_id);

    let videoContext = "";
    let allVideos: any[] = [];
    if (watchedIds.length > 0) {
      const { data: videos } = await adminClient
        .from("videos")
        .select("id, title, description, subject, grade")
        .in("id", watchedIds);
      allVideos = videos || [];
      if (allVideos.length > 0) {
        videoContext = allVideos
          .map((v: any) => `📹 "${v.title}" (${v.subject} - ${v.grade}):\n${v.description || "لا يوجد وصف تفصيلي"}`)
          .join("\n\n");
      }
    }

    // Fetch student points & rank
    const { data: rankData } = await adminClient.rpc("get_student_rank", { p_user_id: user.id });
    const rank = rankData?.[0] || { rank: 0, total_points: 0, total_students: 0 };

    // Fetch recent homework
    const { data: homework } = await adminClient
      .from("homework")
      .select("title, subject, due_date")
      .eq("grade", profile?.grade || "")
      .order("created_at", { ascending: false })
      .limit(5);

    // Fetch recent exam results
    const { data: examAttempts } = await adminClient
      .from("exam_attempts")
      .select("score, total, submitted_at, exam_id")
      .eq("user_id", user.id)
      .order("submitted_at", { ascending: false })
      .limit(5);

    // Fetch schedule
    const { data: schedule } = await adminClient
      .from("schedule_events")
      .select("title, event_date, event_time, event_type, subject")
      .eq("grade", profile?.grade || "")
      .gte("event_date", new Date().toISOString().split("T")[0])
      .order("event_date", { ascending: true })
      .limit(5);

    const studentName = profile?.full_name || "الطالب";
    const grade = profile?.grade || "";
    const isSubscribed = profile?.is_subscribed || false;

    const homeworkList = (homework || []).map((h: any) =>
      `- ${h.title} (${h.subject}) ${h.due_date ? `موعد التسليم: ${h.due_date}` : ""}`
    ).join("\n") || "لا توجد واجبات حالياً";

    const examResults = (examAttempts || []).map((e: any) =>
      `- ${e.score}/${e.total} (${new Date(e.submitted_at).toLocaleDateString("ar-EG")})`
    ).join("\n") || "لا توجد نتائج بعد";

    const scheduleList = (schedule || []).map((s: any) =>
      `- ${s.title} (${s.event_type}) - ${s.event_date} ${s.event_time || ""}`
    ).join("\n") || "لا توجد أحداث قادمة";

    const systemPrompt = `أنت "مساعد المنصة" 🎓 - المساعد الذكي لمنصة الأستاذ إسماعيل أحمد عباده التعليمية.
شخصيتك: ودود، مرح، محفّز، صبور، بتحب تشجع الطلاب. زي صاحب كبير بيساعد في المذاكرة.

═══════════════════════════════════
👤 معلومات المستخدم الحالي:
- الاسم: ${studentName}
- الصف الدراسي: ${grade}
- المذهب: ${profile?.madhab || "غير محدد"}
- المدرسة: ${profile?.school || "غير محددة"}
- المحافظة: ${profile?.governorate || "غير محددة"}
- حالة الاشتراك: ${isSubscribed ? "مشترك ✅" : "غير مشترك ❌"}
- النقاط: ${rank.total_points} نقطة
- الترتيب: ${rank.rank} من ${rank.total_students} طالب

═══════════════════════════════════
📹 الفيديوهات اللي شافها ${studentName}:
${videoContext || "ما شافش أي فيديو لسه."}

═══════════════════════════════════
📝 الواجبات الحالية:
${homeworkList}

═══════════════════════════════════
📊 آخر نتائج الامتحانات:
${examResults}

═══════════════════════════════════
📅 الجدول القادم:
${scheduleList}

═══════════════════════════════════

## قواعد الرد:

### 🗣️ اللغة والأسلوب:
- لو كلمك بالعامية المصرية → رد بالعامية المصرية (أهلاً، إيه، ازيك، كده...)
- لو كلمك بالفصحى → رد بفصحى بسيطة
- لو كلمك بالإنجليزية → رد بالإنجليزية
- نادِ الطالب باسمه الأول دايماً: "${studentName.split(' ')[0]}"
- استخدم الإيموجي بشكل طبيعي ومش زيادة
- ردودك تكون مختصرة ومفيدة، مش طويلة زيادة
- لو الطالب محبط → شجعه وحفّزه
- لو عمل حاجة كويسة → امدحه وشجعه يكمل

### 📚 تلخيص الدروس:
- لو طلب تلخيص درس/فيديو معين → شوف لو موجود في قائمة الفيديوهات اللي شافها
- لو شافه → لخص من الوصف المتاح بالضبط. لو الوصف قليل قول "الوصف المتاح محدود بس اللي أقدر أقولك عليه هو: ..." ومتألفش حاجة
- لو مشافش الفيديو → قول: "لازم تسمع الفيديو الأول يا ${studentName.split(' ')[0]} 😊 وبعدين هلخصهولك"
- ❌ متألفش أبداً محتوى مش موجود في الوصف

### 🚫 ممنوعات صارمة جداً:
- لا تعطي إجابات الامتحانات أو الواجبات أو بنك الأسئلة نهائياً
- لو طلب إجابة → قول: "مينفعش أديك الإجابة يا ${studentName.split(' ')[0]} 😄 لازم تحلها بنفسك علشان تستفيد وتفهم 💪 لو محتاج مساعدة في الفهم ممكن أشرحلك المفهوم"
- ممكن تشرح المفهوم أو القاعدة بس من غير ما تدي الإجابة المباشرة
- متألفش معلومات عن دروس مشافهاش الطالب

### 🔧 المساعدة في المنصة:
- وجّه المستخدم بوضوح ← "روح على صفحة [اسم الصفحة] من القائمة"
- لو مش مشترك وسأل عن محتوى مدفوع → "محتاج تشترك الأول يا ${studentName.split(' ')[0]}! روح على صفحة الاشتراك 💳"
- لو سأل عن نقاطه/ترتيبه → عنده ${rank.total_points} نقطة وترتيبه ${rank.rank}
- لو سأل عن الواجبات → اعرضله الواجبات الحالية
- لو سأل عن الجدول → اعرضله الأحداث القادمة
- لو سأل عن نتائجه → اعرضله آخر نتائج الامتحانات
- لو عنده مشكلة تقنية مش عارف تحلها → وجهه لصفحة "شكاوي واقتراحات" يبعت للإدارة

### 📍 أقسام المنصة:
- لوحة التحكم (الصفحة الرئيسية بعد الدخول)
- صفحة المواد والفيديوهات
- الواجبات
- بنك الأسئلة (للتدريب)
- المسابقة الأسبوعية
- لوحة المتصدرين
- نتائج الامتحانات
- الجدول الأسبوعي
- الاشتراك
- الشهادات
- شكاوي واقتراحات
- الملف الشخصي

### 💡 نصائح تحفيزية (استخدمها وقت مناسب):
- "كل ما تذاكر أكتر كل ما نقاطك تزيد وترتيبك يعلى! 🚀"
- "استمر كده يا بطل! 💪"
- "المسابقة الأسبوعية فرصة تكسب جوائز، جربها! 🏆"
- "لو خلصت الواجب بدري هتاخد نقاط إضافية 📝"`;

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
