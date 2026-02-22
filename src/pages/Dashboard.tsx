import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, User, LogOut, CheckCircle, ChevronLeft, Star, BookMarked, Scroll, BookHeart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { User as AuthUser } from "@supabase/supabase-js";

interface Profile {
  full_name: string;
  grade: string;
  madhab: string;
  is_subscribed: boolean;
  school: string | null;
  governorate: string | null;
}

const gradeSubjects: Record<string, { title: string; icon: any; description: string }[]> = {
  "الصف الأول الإعدادي": [
    { title: "الفقه", icon: BookMarked, description: "دراسة شاملة لأحكام الفقه على المذهب المحدد" },
    { title: "التوحيد", icon: Star, description: "شرح مقرر للعقيدة الإسلامية وأركان الإيمان" },
    { title: "التفسير", icon: Scroll, description: "تفسير الآيات القرآنية وفهم معانيها" },
    { title: "الحديث الشريف", icon: BookHeart, description: "دراسة الأحاديث النبوية الشريفة المقررة" },
    { title: "السيرة النبوية", icon: BookOpen, description: "دراسة سيرة النبي صلى الله عليه وسلم" },
  ],
  "الصف الثاني الإعدادي": [
    { title: "الفقه", icon: BookMarked, description: "دراسة شاملة لأحكام الفقه على المذهب المحدد" },
    { title: "التوحيد", icon: Star, description: "شرح مقرر للعقيدة الإسلامية وأركان الإيمان" },
    { title: "التفسير", icon: Scroll, description: "تفسير الآيات القرآنية وفهم معانيها" },
    { title: "الحديث الشريف", icon: BookHeart, description: "دراسة الأحاديث النبوية الشريفة المقررة" },
    { title: "السيرة النبوية", icon: BookOpen, description: "دراسة سيرة النبي صلى الله عليه وسلم" },
  ],
  "الصف الثالث الإعدادي": [
    { title: "الفقه", icon: BookMarked, description: "دراسة شاملة لأحكام الفقه على المذهب المحدد" },
    { title: "التوحيد", icon: Star, description: "شرح مقرر للعقيدة الإسلامية وأركان الإيمان" },
    { title: "التفسير", icon: Scroll, description: "تفسير الآيات القرآنية وفهم معانيها" },
    { title: "الحديث الشريف", icon: BookHeart, description: "دراسة الأحاديث النبوية الشريفة المقررة" },
    { title: "السيرة النبوية", icon: BookOpen, description: "دراسة سيرة النبي صلى الله عليه وسلم" },
  ],
  "الصف الأول الثانوي": [
    { title: "الفقه", icon: BookMarked, description: "دراسة شاملة لأحكام الفقه على المذهب المحدد" },
    { title: "التوحيد", icon: Star, description: "شرح مقرر للعقيدة الإسلامية وأركان الإيمان" },
    { title: "التفسير", icon: Scroll, description: "تفسير الآيات القرآنية وفهم معانيها" },
    { title: "الحديث الشريف", icon: BookHeart, description: "دراسة الأحاديث النبوية الشريفة المقررة" },
    { title: "السيرة النبوية", icon: BookOpen, description: "دراسة سيرة النبي صلى الله عليه وسلم" },
  ],
  "الصف الثاني الثانوي": [
    { title: "الفقه", icon: BookMarked, description: "دراسة شاملة لأحكام الفقه على المذهب المحدد" },
    { title: "التوحيد", icon: Star, description: "شرح مقرر للعقيدة الإسلامية وأركان الإيمان" },
    { title: "التفسير", icon: Scroll, description: "تفسير الآيات القرآنية وفهم معانيها" },
    { title: "الحديث الشريف", icon: BookHeart, description: "دراسة الأحاديث النبوية الشريفة المقررة" },
    { title: "السيرة النبوية", icon: BookOpen, description: "دراسة سيرة النبي صلى الله عليه وسلم" },
  ],
  "الصف الثالث الثانوي": [
    { title: "الفقه", icon: BookMarked, description: "دراسة شاملة لأحكام الفقه على المذهب المحدد" },
    { title: "التوحيد", icon: Star, description: "شرح مقرر للعقيدة الإسلامية وأركان الإيمان" },
    { title: "التفسير", icon: Scroll, description: "تفسير الآيات القرآنية وفهم معانيها" },
    { title: "الحديث الشريف", icon: BookHeart, description: "دراسة الأحاديث النبوية الشريفة المقررة" },
    { title: "السيرة النبوية", icon: BookOpen, description: "دراسة سيرة النبي صلى الله عليه وسلم" },
  ],
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) {
        navigate("/auth/login");
        return;
      }
      setUser(session.user);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth/login");
        return;
      }
      setUser(session.user);
      fetchProfile(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, grade, madhab, is_subscribed, school, governorate")
      .eq("user_id", userId)
      .single();
    
    if (data) setProfile(data);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const subjects = profile ? gradeSubjects[profile.grade] || [] : [];
  const subscriptionPrice = profile?.grade?.includes("إعدادي") ? 150 : 200;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm">منصة الأستاذ إسماعيل</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/profile">
              <Button variant="ghost" size="sm">
                <User className="w-4 h-4 ml-1" />
                الملف الشخصي
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 ml-1" />
              خروج
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="bg-card rounded-2xl border border-border p-6 mb-8 text-center">
          <h1 className="text-2xl font-bold font-amiri mb-2">أهلاً بك يا {profile?.full_name}</h1>
          <p className="text-muted-foreground text-sm mb-4 max-w-md mx-auto">
            مرحبًا بك في منصة الأستاذ إسماعيل أحمد عباده لتعليم أصول الدين والفقه الإسلامي
          </p>

          <div className="inline-block bg-muted rounded-xl p-4 text-sm space-y-1">
            <div className="font-bold">{profile?.full_name}</div>
            <div className="text-muted-foreground">{profile?.grade}</div>
            {profile?.school && <div className="text-muted-foreground">{profile.school} - {profile.governorate}</div>}
            <div className="text-muted-foreground">{profile?.madhab}</div>
            <div className="flex items-center justify-center gap-1 mt-2">
              <CheckCircle className={`w-4 h-4 ${profile?.is_subscribed ? "text-primary" : "text-muted-foreground"}`} />
              <span className={profile?.is_subscribed ? "text-primary font-medium" : "text-muted-foreground"}>
                {profile?.is_subscribed ? "مشترك" : "غير مشترك"}
              </span>
            </div>
          </div>
        </div>

        {/* Why Choose Us */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold font-amiri mb-2">لماذا تختار منصتنا؟</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {[
            { title: "شرح على أعلى مستوى", desc: "شروحات مفصلة ومبسطة لجميع المواد الشرعية" },
            { title: "متابعة مستمرة", desc: "متابعة دورية ومستمرة لمستوى كل طالب" },
            { title: "نتائج مضمونة", desc: "نتائج مميزة ومضمونة بإذن الله" },
            { title: "محتوى متجدد", desc: "محتوى تعليمي متجدد ومحدث باستمرار" },
          ].map((item, i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-4">
              <h3 className="font-bold text-sm mb-1">{item.title}</h3>
              <p className="text-muted-foreground text-xs">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Subjects */}
        <div className="mb-6">
          <h2 className="text-xl font-bold font-amiri text-center mb-2">
            المواد الدراسية - {profile?.grade}
          </h2>
          <p className="text-muted-foreground text-sm text-center mb-6 max-w-lg mx-auto">
            نقدم لك شرحًا شاملاً ومتميزًا لجميع مواد التربية الدينية الإسلامية بأسلوب سهل ومبسط
          </p>
        </div>

        <div className="space-y-4 max-w-2xl mx-auto">
          {subjects.map((subject, i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <subject.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold mb-1">
                    {profile?.madhab && subject.title === "الفقه" ? `${subject.title} ${profile.madhab.replace("الفقه ", "")}` : subject.title}
                  </h3>
                  <p className="text-muted-foreground text-xs mb-3">{subject.description}</p>
                  {profile?.is_subscribed ? (
                    <Button size="sm" variant="outline" className="gap-1">
                      ابدأ المشاهدة
                      <ChevronLeft className="w-3 h-3" />
                    </Button>
                  ) : (
                    <p className="text-xs text-destructive">يرجى الاشتراك أولاً ({subscriptionPrice} جنيه)</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
