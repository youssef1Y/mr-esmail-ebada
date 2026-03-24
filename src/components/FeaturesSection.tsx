import { motion } from "framer-motion";
import { Video, FileText, ClipboardList, Trophy, Bell, BarChart3 } from "lucide-react";
import { StaggerContainer, StaggerItem } from "./StaggerAnimation";

const features = [
  {
    icon: Video,
    title: "فيديوهات تعليمية",
    description: "شروحات مصورة بجودة عالية لجميع المواد الدراسية مع إمكانية المشاهدة في أي وقت ومن أي مكان",
  },
  {
    icon: FileText,
    title: "امتحانات إلكترونية",
    description: "امتحانات متنوعة لقياس مستوى الطالب مع التصحيح الآلي والفوري وعرض النتائج التفصيلية",
  },
  {
    icon: ClipboardList,
    title: "واجبات منزلية",
    description: "واجبات دورية لتثبيت المعلومات مع إمكانية رفع الإجابات وتلقي التقييم من المعلم",
  },
  {
    icon: Trophy,
    title: "نظام النقاط والتحفيز",
    description: "اجمع النقاط من خلال حل الامتحانات والواجبات وتصدّر لوحة المتصدرين بين زملائك",
  },
  {
    icon: Bell,
    title: "إشعارات فورية",
    description: "تلقي إشعارات فورية بكل جديد من فيديوهات وامتحانات وواجبات وتحديثات المنصة",
  },
  {
    icon: BarChart3,
    title: "تقارير الأداء",
    description: "تقارير تفصيلية عن أداء الطالب تُرسل لولي الأمر أسبوعياً عبر الواتساب لمتابعة التقدم",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-20 bg-card/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <span className="inline-block bg-primary/10 text-primary text-sm font-bold px-4 py-1.5 rounded-full mb-4">
            مميزات المنصة
          </span>
          <h2 className="text-3xl md:text-4xl font-bold font-amiri text-foreground mb-4">
            كل ما يحتاجه الطالب في مكان واحد
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            نوفر بيئة تعليمية متكاملة تجمع بين الشرح والتقييم والمتابعة لضمان تفوق الطالب
          </p>
        </motion.div>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" staggerDelay={0.08}>
          {features.map((feature, index) => (
            <StaggerItem key={index}>
              <div className="bg-card rounded-2xl p-6 border border-border hover:border-primary/30 hover:-translate-y-1 transition-all duration-300 h-full">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-base mb-2 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
};

export default FeaturesSection;
