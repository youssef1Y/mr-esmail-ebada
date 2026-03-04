import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, ChevronRight, Newspaper, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { StaggerContainer, StaggerItem } from "@/components/StaggerAnimation";

interface NewsItem {
  id: number;
  title: string;
  body: string;
  date: string;
  icon: string;
}

const newsItems: NewsItem[] = [
  {
    id: 1,
    title: "بدء التسجيل في الفصل الدراسي الثاني",
    body: "نعلن عن فتح باب التسجيل للفصل الدراسي الثاني لجميع المراحل الدراسية. سارعوا بالتسجيل للاستفادة من عروض الاشتراك المميزة.",
    date: "2026-03-01",
    icon: "📚",
  },
  {
    id: 2,
    title: "إضافة مادة السيرة النبوية لجميع الصفوف",
    body: "تم إضافة شرح مادة السيرة النبوية بالكامل لجميع المراحل الدراسية مع فيديوهات وامتحانات شاملة.",
    date: "2026-02-20",
    icon: "🕌",
  },
  {
    id: 3,
    title: "نظام الشهادات الإلكترونية",
    body: "أطلقنا نظام الشهادات الإلكترونية! احصل على الدرجة الكاملة (10/10) في الواجب لتحصل على شهادة تفوق قابلة للطباعة.",
    date: "2026-02-15",
    icon: "🏆",
  },
  {
    id: 4,
    title: "تقارير أداء أسبوعية لأولياء الأمور",
    body: "تم إطلاق خدمة إرسال تقارير أداء أسبوعية لأولياء الأمور عبر الواتساب تتضمن نتائج الامتحانات والواجبات.",
    date: "2026-02-10",
    icon: "📊",
  },
  {
    id: 5,
    title: "بنك الأسئلة الشامل",
    body: "تم تحديث بنك الأسئلة بآلاف الأسئلة الجديدة في جميع المواد لمساعدة الطلاب في التحضير للامتحانات.",
    date: "2026-02-01",
    icon: "❓",
  },
];

const News = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Newspaper className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm">أخبار المنصة</span>
          </div>
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-1">
              العودة <ChevronRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl font-bold font-amiri mb-2">أخبار وأحداث المنصة</h1>
          <p className="text-sm text-muted-foreground">آخر الأخبار والتحديثات والأحداث في منصة الأستاذ إسماعيل أحمد عبادة</p>
        </motion.div>

        <StaggerContainer className="space-y-4" staggerDelay={0.1}>
          {newsItems.map(item => (
            <StaggerItem key={item.id}>
              <motion.div
                whileHover={{ y: -2 }}
                className="bg-card rounded-2xl border border-border p-5 transition-all duration-300 hover:border-primary/20"
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl flex-shrink-0">{item.icon}</div>
                  <div className="flex-1">
                    <h2 className="font-bold text-base mb-1">{item.title}</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-2">{item.body}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.date).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}
                    </div>
                  </div>
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </main>
    </div>
  );
};

export default News;
