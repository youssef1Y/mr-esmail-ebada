import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { StaggerContainer, StaggerItem } from "./StaggerAnimation";

const testimonials = [
  {
    name: "أحمد محمد",
    grade: "الصف الثالث الإعدادي",
    text: "المنصة ممتازة جداً والشرح واضح ومبسط. استفدت كتير من الفيديوهات والامتحانات اللي بتساعدني أراجع قبل الامتحان.",
    rating: 5,
  },
  {
    name: "فاطمة علي",
    grade: "الصف الأول الثانوي",
    text: "أفضل منصة للعلوم الشرعية. الأستاذ إسماعيل بيشرح بطريقة سهلة وممتعة. الواجبات والتقييمات بتساعدني أعرف مستواي.",
    rating: 5,
  },
  {
    name: "محمود أحمد",
    grade: "الصف الثاني الإعدادي",
    text: "بنك الأسئلة الشامل ساعدني كتير في التحضير للامتحانات. ونظام النقاط بيحفزني أذاكر أكتر.",
    rating: 5,
  },
  {
    name: "مريم حسن",
    grade: "الصف الثاني الثانوي",
    text: "المنصة فيها كل حاجة محتاجاها من شرح وامتحانات وواجبات. أسلوب الأستاذ إسماعيل مميز جداً وبيوصل المعلومة بسهولة.",
    rating: 5,
  },
];

const TestimonialsSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <span className="inline-block bg-gold/10 text-gold text-sm font-bold px-4 py-1.5 rounded-full mb-4">
            آراء الطلاب
          </span>
          <h2 className="text-3xl md:text-4xl font-bold font-amiri text-foreground mb-4">
            ماذا يقول طلابنا عن المنصة
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            نفتخر بثقة طلابنا وأولياء أمورهم في منصتنا التعليمية
          </p>
        </motion.div>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto" staggerDelay={0.12}>
          {testimonials.map((t, index) => (
            <StaggerItem key={index}>
              <div className="bg-card rounded-2xl p-6 border border-border hover:border-primary/20 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                <Quote className="absolute top-4 left-4 w-8 h-8 text-primary/10" />
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-gold text-gold" />
                  ))}
                </div>
                <p className="text-foreground text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div className="border-t border-border pt-3">
                  <p className="font-bold text-sm text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.grade}</p>
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
};

export default TestimonialsSection;
