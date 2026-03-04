import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Newspaper, Calendar, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { StaggerContainer, StaggerItem } from "@/components/StaggerAnimation";
import { supabase } from "@/integrations/supabase/client";

interface NewsItem {
  id: string;
  title: string;
  body: string;
  icon: string;
  created_at: string;
}

const News = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      const { data } = await supabase
        .from("news")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setNews(data);
      setLoading(false);
    };
    fetchNews();
  }, []);

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

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : news.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-8 text-center">
            <Newspaper className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-bold mb-1">لا توجد أخبار حالياً</h3>
            <p className="text-sm text-muted-foreground">ترقبوا آخر الأخبار والتحديثات</p>
          </div>
        ) : (
          <StaggerContainer className="space-y-4" staggerDelay={0.1}>
            {news.map(item => (
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
                        {new Date(item.created_at).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </main>
    </div>
  );
};

export default News;
