import { BookOpen, Heart, Target, RefreshCw, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { StaggerContainer, StaggerItem } from "./StaggerAnimation";

const teacherImg = new URL("@/assets/teacher.jpg", import.meta.url).href;

const features = [
  {
    icon: BookOpen,
    title: "تعليم شامل",
    description: "نقدم شرحًا وافيًا في التفسير والحديث والتوحيد والسيرة والفقه بمذاهبه الثلاثة (الشافعي والمالكي والحنفي)",
  },
  {
    icon: Target,
    title: "خبرة تعليمية",
    description: "معد ومراجع كتاب المرشد الأزهري وصاحب سلسلة الأزهري في العلوم الشرعية",
  },
  {
    icon: Heart,
    title: "رعاية الطلاب",
    description: "نحرص على متابعة كل طالب ومساعدته في تحقيق أفضل النتائج الدراسية",
  },
  {
    icon: RefreshCw,
    title: "أهداف واضحة",
    description: "نضع خطة تعليمية واضحة لكل مرحلة دراسية لضمان تحقيق الأهداف المرجوة",
  },
];

const AboutSection = () => {
  return (
    <section id="about" className="py-24 bg-background relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-primary/3 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gold/3 rounded-full blur-[150px]" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Top section with teacher image */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="order-2 lg:order-1"
          >
            <span className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-bold px-5 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4" />
              من نحن
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-amiri text-foreground mb-6 leading-tight">
              منصة الأستاذ إسماعيل أحمد عبادة
              <span className="block text-primary text-3xl md:text-4xl mt-2">لتدريس العلوم الشرعية</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed text-base md:text-lg mb-6">
              متخصصة في تعليم الفقه الشافعي والمالكي والحنفي وأصول الدين (التوحيد – التفسير – الحديث – السيرة) للأزهر الشريف عن بعد من أي مكان في جمهورية مصر العربية. خبرة أكثر من عشر سنوات في تدريس مواد الأزهر الشريف.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-gold/10 rounded-full px-4 py-2">
                <span className="text-3xl font-bold text-gold">10+</span>
                <span className="text-sm text-muted-foreground">سنة خبرة</span>
              </div>
              <div className="flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2">
                <span className="text-3xl font-bold text-primary">500+</span>
                <span className="text-sm text-muted-foreground">طالب</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="order-1 lg:order-2 flex justify-center"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-gold/20 rounded-3xl blur-[40px] scale-90" />
              <div className="relative w-72 h-72 md:w-80 md:h-80 rounded-3xl overflow-hidden border-4 border-primary/20 shadow-2xl shadow-primary/10">
                <img src={teacherImg} alt="الأستاذ إسماعيل أحمد عبادة" className="w-full h-full object-cover" loading="lazy" />
              </div>
              {/* Decorative badge */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-4 -left-4 bg-card border border-border rounded-2xl px-4 py-3 shadow-lg"
              >
                <p className="text-xs text-muted-foreground">مُعدّ كتاب</p>
                <p className="text-sm font-bold text-foreground">المرشد الأزهري</p>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Feature cards */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" staggerDelay={0.12}>
          {features.map((feature, index) => (
            <StaggerItem key={index}>
              <motion.div
                whileHover={{ y: -6, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="bg-card rounded-2xl p-6 text-center border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 h-full"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
};

export default AboutSection;
