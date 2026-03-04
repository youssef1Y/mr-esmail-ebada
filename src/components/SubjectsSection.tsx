import { BookOpen, BookMarked, Scroll, Star, Heart, Landmark } from "lucide-react";
import { motion } from "framer-motion";
import { StaggerContainer, StaggerItem } from "./StaggerAnimation";

const subjects = [
  {
    icon: BookOpen,
    title: "الفقه الشافعي",
    description: "دراسة أحكام العبادات والمعاملات وفق المذهب الشافعي مع التطبيقات العملية والأمثلة المعاصرة",
    color: "from-emerald-500/20 to-emerald-600/10",
    iconColor: "text-emerald-600",
  },
  {
    icon: BookMarked,
    title: "الفقه المالكي",
    description: "تعلم أصول وفروع الفقه المالكي مع شرح مبسط للمسائل الفقهية المهمة في حياة المسلم",
    color: "from-blue-500/20 to-blue-600/10",
    iconColor: "text-blue-600",
  },
  {
    icon: Scroll,
    title: "الفقه الحنفي",
    description: "دراسة شاملة للفقه الحنفي مع بيان الأدلة والترجيحات والمقارنة بين الأقوال",
    color: "from-purple-500/20 to-purple-600/10",
    iconColor: "text-purple-600",
  },
  {
    icon: Star,
    title: "التوحيد",
    description: "تعلم العقيدة الإسلامية الصحيحة وأركان الإيمان مع الرد على الشبهات المعاصرة",
    color: "from-amber-500/20 to-amber-600/10",
    iconColor: "text-amber-600",
  },
  {
    icon: Heart,
    title: "التفسير",
    description: "فهم معاني القرآن الكريم وتدبر آياته واستخراج الأحكام والعبر من كتاب الله",
    color: "from-rose-500/20 to-rose-600/10",
    iconColor: "text-rose-600",
  },
  {
    icon: BookOpen,
    title: "الحديث الشريف",
    description: "دراسة الأحاديث النبوية الشريفة وشرحها واستخراج الأحكام والفوائد منها",
    color: "from-indigo-500/20 to-indigo-600/10",
    iconColor: "text-indigo-600",
  },
  {
    icon: Landmark,
    title: "السيرة النبوية",
    description: "دراسة حياة النبي ﷺ من المولد حتى الوفاة واستخلاص الدروس والعبر من سيرته العطرة",
    color: "from-teal-500/20 to-teal-600/10",
    iconColor: "text-teal-600",
  },
];

const SubjectsSection = () => {
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
            المواد الدراسية
          </span>
          <h2 className="text-3xl md:text-4xl font-bold font-amiri text-foreground mb-4">
            المواد التي نُدرِّسها في المنصة
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            نقدم منهجًا تعليميًا شاملًا يغطي جميع فروع العلوم الشرعية لطلاب المرحلتين الإعدادية والثانوية الأزهرية، مع مراعاة اختلاف المذاهب الفقهية
          </p>
        </motion.div>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" staggerDelay={0.1}>
          {subjects.map((subject, index) => (
            <StaggerItem key={index}>
              <motion.div
                whileHover={{ y: -6, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
                className={`bg-gradient-to-br ${subject.color} rounded-2xl p-6 border border-border hover:border-primary/30 transition-colors duration-300 h-full backdrop-blur-sm`}
              >
                <div className={`w-14 h-14 rounded-xl bg-card flex items-center justify-center mb-4 shadow-sm`}>
                  <subject.icon className={`w-7 h-7 ${subject.iconColor}`} />
                </div>
                <h3 className="font-bold text-lg mb-2 text-foreground">{subject.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{subject.description}</p>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
};

export default SubjectsSection;
