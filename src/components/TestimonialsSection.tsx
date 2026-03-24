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
  {
    name: "يوسف إبراهيم",
    grade: "الصف الثالث الثانوي",
    text: "المنصة ساعدتني أحقق أعلى الدرجات في مواد الفقه والتوحيد. الشرح وافي ومنظم والمتابعة ممتازة.",
    rating: 5,
  },
  {
    name: "آية عبدالرحمن",
    grade: "الصف الأول الإعدادي",
    text: "بحب المنصة جداً وبستمتع بالدروس. نظام النقاط والمسابقات بيخلي التعلم ممتع ومشوق.",
    rating: 5,
  },
];

const TestimonialsSection = () => {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-0 left-1/4 w-80 h-80 bg-gold/3 rounded-full blur-[150px]" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/3 rounded-full blur-[180px]" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="inline-block bg-gold/10 text-gold text-sm font-bold px-5 py-2 rounded-full mb-4">
            ⭐ قصص نجاح طلابنا
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-amiri text-foreground mb-4">
            ماذا يقول
            <span className="block text-primary text-3xl md:text-4xl mt-2">طلابنا عن المنصة</span>
          </h2>
          <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
            شهادات حقيقية من طلاب حققوا النجاح والتفوق معنا
          </p>
        </motion.div>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto" staggerDelay={0.1}>
          {testimonials.map((t, index) => (
            <StaggerItem key={index}>
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="bg-card rounded-2xl p-6 border border-border hover:border-gold/30 transition-all duration-300 hover:shadow-xl hover:shadow-gold/5 relative overflow-hidden h-full"
              >
                <Quote className="absolute top-4 left-4 w-10 h-10 text-gold/10" />
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-gold text-gold" />
                  ))}
                </div>
                <p className="text-foreground text-sm leading-relaxed mb-5">"{t.text}"</p>
                <div className="border-t border-border pt-4">
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
