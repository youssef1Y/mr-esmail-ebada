import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trophy, Key, ChevronRight, Share2, Copy, Headphones, Gamepad2, Gift, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import CompetitionPlayTab from "@/components/competition/CompetitionPlayTab";
import CompetitionWinnersTab from "@/components/competition/CompetitionWinnersTab";

type TabType = "play" | "winners" | "keys" | "share" | "help";

const WeeklyCompetition = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("play");
  const [userId, setUserId] = useState("");
  const [keysCount, setKeysCount] = useState(0);
  const [referralCode, setReferralCode] = useState("");
  const [activeComp, setActiveComp] = useState<any>(null);
  const [todayPlayed, setTodayPlayed] = useState(false);
  const [pastWinners, setPastWinners] = useState<any[]>([]);
  const [myEntries, setMyEntries] = useState<any[]>([]);
  const [grade, setGrade] = useState("");

  useEffect(() => { init(); }, []);

  const init = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/auth/login"); return; }
    const uid = session.user.id;
    setUserId(uid);

    await supabase.rpc("give_first_key", { p_user_id: uid });

    const { data: keysData } = await supabase.from("student_keys" as any).select("keys_count").eq("user_id", uid).single();
    if (keysData) setKeysCount(Math.min((keysData as any).keys_count || 0, 2));

    const { data: refCode } = await supabase.rpc("get_or_create_referral_code", { p_user_id: uid });
    if (refCode) setReferralCode(refCode as string);

    const { data: profile } = await supabase.from("profiles").select("grade").eq("user_id", uid).single();
    if (profile) setGrade(profile.grade);

    const { data: comps } = await supabase.from("weekly_competitions" as any).select("*").eq("status", "active").order("created_at", { ascending: false }).limit(1);
    if (comps && comps.length > 0) {
      const comp = comps[0] as any;
      setActiveComp(comp);
      const { data: entryCount } = await supabase.rpc("get_today_competition_entry", { p_user_id: uid, p_competition_id: comp.id });
      if (entryCount && (entryCount as number) > 0) setTodayPlayed(true);
      const { data: entries } = await supabase.from("competition_entries" as any).select("*").eq("user_id", uid).eq("competition_id", comp.id).order("created_at", { ascending: false });
      if (entries) setMyEntries(entries as any[]);
    }

    const { data: pastComps } = await supabase.from("weekly_competitions" as any).select("*").eq("status", "completed").order("week_end", { ascending: false }).limit(20);
    if (pastComps) setPastWinners(pastComps as any[]);

    setLoading(false);
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/auth/register?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    toast({ title: "تم النسخ!", description: "تم نسخ رابط الدعوة" });
  };

  const shareReferralLink = () => {
    const link = `${window.location.origin}/auth/register?ref=${referralCode}`;
    if (navigator.share) {
      navigator.share({ title: "منصة الأستاذ إسماعيل أحمد عباده", text: "سجل الآن في أفضل منصة لتعليم التربية الدينية الإسلامية!", url: link });
    } else {
      copyReferralLink();
    }
  };

  const tabs = [
    { id: "help" as TabType, label: "مساعدة", icon: Headphones },
    { id: "share" as TabType, label: "شارك", icon: Share2 },
    { id: "keys" as TabType, label: "المفاتيح", icon: Key },
    { id: "winners" as TabType, label: "الفائزون", icon: Trophy },
    { id: "play" as TabType, label: "العب", icon: Gamepad2 },
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
          <div className="flex items-center gap-2 bg-muted rounded-full px-3 py-1.5">
            <span className="font-bold text-sm">{keysCount}</span>
            <Key className="w-4 h-4 text-amber-500" />
          </div>
          <Link to="/dashboard">
            <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>

      {/* Warm gradient background */}
      <div className="bg-gradient-to-b from-amber-100/40 dark:from-amber-950/20 via-orange-50/20 dark:via-transparent to-transparent h-32 -mb-32 pointer-events-none" />

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        {activeTab === "play" && (
          <CompetitionPlayTab
            keysCount={keysCount}
            activeComp={activeComp}
            todayPlayed={todayPlayed}
            grade={grade}
            userId={userId}
            myEntries={myEntries}
            onKeyUsed={() => setKeysCount(k => Math.max(0, k - 1))}
            onTodayPlayed={() => setTodayPlayed(true)}
          />
        )}

        {activeTab === "winners" && <CompetitionWinnersTab pastWinners={pastWinners} />}

        {activeTab === "keys" && (
          <div className="px-4 py-6 max-w-lg mx-auto">
            <div className="text-right mb-6">
              <h2 className="text-xl font-bold">المفاتيح</h2>
              <p className="text-muted-foreground text-sm">رصيدك وكيفية الحصول على المزيد</p>
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-8 mb-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Key className="w-8 h-8 text-amber-500" />
                <span className="text-5xl font-bold text-amber-600 dark:text-amber-400">{keysCount}</span>
              </div>
              <p className="text-muted-foreground text-sm">مفاتيح متاحة (الحد الأقصى ٢)</p>
            </motion.div>

            <div className="space-y-3">
              <div className="bg-card rounded-2xl border border-border p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Gift className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-sm">مفتاح مجاني</p>
                  <p className="text-xs text-muted-foreground">تحصل على مفتاح واحد مجاني عند أول دخول للمسابقة</p>
                </div>
              </div>
              <div className="bg-card rounded-2xl border border-border p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Share2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-sm">ادعُ صديقك</p>
                  <p className="text-xs text-muted-foreground">شارك رابط المنصة مع أصدقائك. عندما يسجل طالب جديد برابطك، تحصل على مفتاح!</p>
                </div>
              </div>
              <div className="bg-card rounded-2xl border border-border p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Key className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="font-bold text-sm">كيف تستخدم المفتاح؟</p>
                  <p className="text-xs text-muted-foreground">كل مفتاح يفتح باب مادة واحدة. اختر المادة وأجب على السؤال. إجابة صحيحة = دخول السحب!</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "share" && (
          <div className="px-4 py-6 max-w-lg mx-auto">
            <div className="text-right mb-6">
              <h2 className="text-xl font-bold">شارك واربح</h2>
              <p className="text-muted-foreground text-sm">ادعُ أصدقاءك واحصل على مفاتيح</p>
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-2xl border border-border p-6 mb-4 text-center">
              <Share2 className="w-10 h-10 text-primary mx-auto mb-3" />
              <p className="font-bold mb-1">شارك رابط المنصة</p>
              <p className="text-sm text-muted-foreground mb-4">عندما يسجل طالب جديد برابطك، تحصل أنت على مفتاح إضافي!</p>
              <div className="flex gap-2">
                <Button onClick={shareReferralLink} className="flex-1 h-12 rounded-xl gap-2">
                  <Share2 className="w-4 h-4" /> مشاركة
                </Button>
                <Button onClick={copyReferralLink} variant="outline" className="h-12 rounded-xl gap-2">
                  <Copy className="w-4 h-4" /> نسخ الرابط
                </Button>
              </div>
            </motion.div>

            {referralCode && (
              <div className="bg-muted rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">كود الدعوة الخاص بك</p>
                <p className="font-mono font-bold text-lg tracking-widest">{referralCode}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "help" && (
          <div className="px-4 py-6 max-w-lg mx-auto">
            <div className="text-right mb-6">
              <h2 className="text-xl font-bold">مساعدة</h2>
              <p className="text-muted-foreground text-sm">كيف تلعب المسابقة؟</p>
            </div>

            <div className="space-y-3">
              {[
                { q: "كيف أشارك في المسابقة؟", a: "اختر مادة من الأبواب المتاحة، وأجب على السؤال. إذا أجبت إجابة صحيحة، تدخل السحب الأسبوعي تلقائياً." },
                { q: "كيف أحصل على مفاتيح؟", a: "تحصل على مفتاح مجاني عند أول دخول. يمكنك الحصول على مفاتيح إضافية بدعوة أصدقائك للتسجيل في المنصة." },
                { q: "كم مرة أقدر ألعب في اليوم؟", a: "مرة واحدة في اليوم. كل لعبة تكلف مفتاح واحد وتختار مادة واحدة." },
                { q: "كيف يتم اختيار الفائز؟", a: "في نهاية الأسبوع، يتم سحب عشوائي بين جميع الطلاب الذين أجابوا إجابات صحيحة خلال الأسبوع. فائز واحد من جميع المواد." },
                { q: "ما هي الجائزة؟", a: "الجائزة تختلف كل أسبوع. يتم الإعلان عنها في صفحة المسابقة." },
              ].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className="bg-card rounded-2xl border border-border p-4">
                  <div className="flex items-start gap-3">
                    <HelpCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold text-sm mb-1">{item.q}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{item.a}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 inset-x-0 bg-card/95 backdrop-blur-lg border-t border-border z-50">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 transition-colors ${
                  isActive ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "fill-current" : ""}`} />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default WeeklyCompetition;
