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

    // Get user from auth header
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
      .select("full_name, grade, is_subscribed, madhab, school, governorate")
      .eq("user_id", user.id)
      .single();

    // Fetch watched video IDs
    const { data: views } = await adminClient
      .from("video_views")
      .select("video_id")
      .eq("user_id", user.id);
    const watchedIds = (views || []).map((v: any) => v.video_id);

    // Fetch video details for watched videos (title + description)
    let videoContext = "";
    if (watchedIds.length > 0) {
      const { data: videos } = await adminClient
        .from("videos")
        .select("id, title, description, subject, grade")
        .in("id", watchedIds);
      if (videos && videos.length > 0) {
        videoContext = videos
          .map(
            (v: any) =>
              `📹 ${v.title} (${v.subject} - ${v.grade}):\n${v.description || "لا يوجد وصف"}`
          )
          .join("\n\n");
      }
    }

    // Check if user is a parent (from parent_accounts via phone)
    let isParent = false;
    if (profile?.governorate === "parent") {
      isParent = true;
    }

    const studentName = profile?.full_name || "الطالب";
    const grade = profile?.grade || "";
    const isSubscribed = profile?.is_subscribed || false;

    const systemPrompt = `أنت مساعد ذكي اسمه "مساعد المنصة" تابع لمنصة الأستاذ إسماعيل أحمد عباده التعليمية.

## معلومات المستخدم الحالي:
- الاسم: ${studentName}
- الصف: ${grade}
- الاشتراك: ${isSubscribed ? "مشترك ✅" : "غير مشترك ❌"}

## الفيديوهات التي شاهدها الطالب:
${videoContext || "لم يشاهد أي فيديو بعد."}

## تعليمات صارمة:

### اللغة والأسلوب:
- تحدث بالعربية الفصحى البسيطة أو العامية المصرية حسب أسلوب المستخدم
- إذا كتب بالإنجليزية رد بالإنجليزية
- كن ودودًا ومرحًا مع الطلاب، ومحترمًا مع أولياء الأمور
- نادِ الطالب باسمه "${studentName}"

### تلخيص الدروس:
- إذا طلب الطالب تلخيص فيديو/درس، تحقق أولاً هل شاهده (موجود في قائمة الفيديوهات أعلاه)
- إذا لم يشاهده، قل: "لازم تسمع الفيديو الأول يا ${studentName} وبعدها أقدر ألخصهولك 😊"
- إذا شاهده، لخّص فقط من محتوى الوصف المتاح (لا تخترع معلومات)
- التلخيص يكون بالضبط زي اللي في الفيديو، لا تضيف معلومات من عندك

### ممنوعات صارمة:
- لا تعطِ إجابات الامتحانات أو الواجبات أبداً
- لا تحل أسئلة بنك الأسئلة
- إذا طلب إجابة، قل: "مينفعش أديك الإجابة يا ${studentName}، لازم تحلها بنفسك علشان تستفيد 💪"
- لا تخترع محتوى دروس لم يشاهدها الطالب

### المساعدة في المنصة:
- ساعد في مشاكل التسجيل، الدخول، الاشتراك، التنقل
- وجّه المستخدم لأقسام المنصة: الدروس، الواجبات، المسابقة الأسبوعية، لوحة المتصدرين، الجدول
- اشرح كيفية استخدام أي خاصية في المنصة
- ${!isSubscribed ? `لو سأل عن محتوى مدفوع، وجّهه لصفحة الاشتراك` : ""}

### هيكل المنصة:
- /dashboard - لوحة التحكم الرئيسية
- /subject/[المادة] - صفحة الفيديوهات لكل مادة
- /homework - صفحة الواجبات
- /weekly-competition - المسابقة الأسبوعية
- /leaderboard - لوحة المتصدرين
- /question-bank - بنك الأسئلة للتدريب
- /my-results - نتائج الامتحانات
- /schedule - الجدول الأسبوعي
- /subscribe - صفحة الاشتراك
- /contact - شكاوي واقتراحات
- /certificates - الشهادات
- /profile - الملف الشخصي`;

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
