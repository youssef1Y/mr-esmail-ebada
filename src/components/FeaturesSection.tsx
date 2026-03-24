import { motion } from "framer-motion";
import { Video, FileText, ClipboardList, Trophy, Bell, BarChart3 } from "lucide-react";
import { StaggerContainer, StaggerItem } from "./StaggerAnimation";

const features = [
  {
    icon: Video,
    title: "فيديوهات تعليمية",
    description: "شروحات مصورة بجودة عالية لجميع المواد الدراسية مع إمكانية المشاهدة في أي وقت ومن أي مكان",
    accent: "from-primary/15 to-primary/5",
  },
  {
    icon: FileText,
    title: "امتحانات إلكترونية",
    description: "امتحانات متنوعة لقياس مستوى الطالب مع التصحيح الآلي والفوري وعرض النتائج التفصيلية",
    accent: "from-blue-500/15 to-blue-500/5",
  },
  {
    icon: ClipboardList,
    title: "واجبات منزلية",
    description: "واجبات دورية لتثبيت المعلومات مع إمكانية رفع الإجابات وتلقي التقييم من المعلم",
    accent: "from-emerald-500/15 to-emerald-500/5",
  },
  {
    icon: Trophy,
    title: "نظام النقاط والتحفيز",
    description: "اجمع النقاط من خلال حل الامتحانات والواجبات وتصدّر لوحة المتصدرين بين زملائك",
    accent: "from-amber-500/15 to-amber-500/5",
  },
  {
    icon: Bell,
    title: "إشعارات فورية",
    description: "تلقي إشعارات فورية بكل جديد من فيديوهات وامتحانات وواجبات وتحديثات المنصة",
    accent: "from-rose-500/15 to-rose-500/5",
  },
  {
    icon: BarChart3,
    title: "تقارير الأداء",
    description: "تقارير تفصيلية عن أداء الطالب تُرسل لولي الأمر أسبوعياً عبر الواتساب لمتابعة التقدم",
    accent: "from-purple-500/15 to-purple-500/5",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-24 bg-card/50 relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/3 rounded-full blur-[200px]" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-gold/3 rounded-full blur-[150px]" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="inline-block bg-primary/10 text-primary text-sm font-bold px-5 py-2 rounded-full mb-4">
            مميزات المنصة
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-amiri text-foreground mb-4">
            كل ما يحتاجه الطالب
            <span className="block text-primary text-3xl md:text-4xl mt-2">في مكان واحد</span>
          </h2>
          <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
            نوفر بيئة تعليمية متكاملة تجمع بين الشرح والتقييم والمتابعة لضمان تفوق الطالب
          </p>
        </motion.div>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" staggerDelay={0.08}>
          {features.map((feature, index) => (
            <StaggerItem key={index}>
              <motion.div
                whileHover={{ y: -6, boxShadow: "0 20px 40px -15px hsl(var(--primary) / 0.12)" }}
                transition={{ type: "spring", stiffness: 300 }}
                className="bg-card rounded-2xl p-7 border border-border hover:border-primary/30 transition-all duration-300 h-full group"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.accent} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-3 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
};

export default FeaturesSection;
