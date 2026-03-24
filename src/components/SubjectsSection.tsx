import { BookOpen, BookMarked, Scroll, Star, Heart, Landmark } from "lucide-react";
import { motion } from "framer-motion";
import { StaggerContainer, StaggerItem } from "./StaggerAnimation";

const subjects = [
  {
    icon: BookOpen,
    title: "الفقه الشافعي",
    description: "دراسة أحكام العبادات والمعاملات وفق المذهب الشافعي مع التطبيقات العملية والأمثلة المعاصرة",
    color: "from-emerald-500/20 to-emerald-600/10",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    borderHover: "hover:border-emerald-500/30",
  },
  {
    icon: BookMarked,
    title: "الفقه المالكي",
    description: "تعلم أصول وفروع الفقه المالكي مع شرح مبسط للمسائل الفقهية المهمة في حياة المسلم",
    color: "from-blue-500/20 to-blue-600/10",
    iconColor: "text-blue-600 dark:text-blue-400",
    borderHover: "hover:border-blue-500/30",
  },
  {
    icon: Scroll,
    title: "الفقه الحنفي",
    description: "دراسة شاملة للفقه الحنفي مع بيان الأدلة والترجيحات والمقارنة بين الأقوال",
    color: "from-purple-500/20 to-purple-600/10",
    iconColor: "text-purple-600 dark:text-purple-400",
    borderHover: "hover:border-purple-500/30",
  },
  {
    icon: Star,
    title: "التوحيد",
    description: "تعلم العقيدة الإسلامية الصحيحة وأركان الإيمان مع الرد على الشبهات المعاصرة",
    color: "from-amber-500/20 to-amber-600/10",
    iconColor: "text-amber-600 dark:text-amber-400",
    borderHover: "hover:border-amber-500/30",
  },
  {
    icon: Heart,
    title: "التفسير",
    description: "فهم معاني القرآن الكريم وتدبر آياته واستخراج الأحكام والعبر من كتاب الله",
    color: "from-rose-500/20 to-rose-600/10",
    iconColor: "text-rose-600 dark:text-rose-400",
    borderHover: "hover:border-rose-500/30",
  },
  {
    icon: BookOpen,
    title: "الحديث الشريف",
    description: "دراسة الأحاديث النبوية الشريفة وشرحها واستخراج الأحكام والفوائد منها",
    color: "from-indigo-500/20 to-indigo-600/10",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    borderHover: "hover:border-indigo-500/30",
  },
  {
    icon: Landmark,
    title: "السيرة النبوية",
    description: "دراسة حياة النبي ﷺ من المولد حتى الوفاة واستخلاص الدروس والعبر من سيرته العطرة",
    color: "from-teal-500/20 to-teal-600/10",
    iconColor: "text-teal-600 dark:text-teal-400",
    borderHover: "hover:border-teal-500/30",
  },
];

const SubjectsSection = () => {
  return (
    <section className="py-24 bg-card/50 relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-primary/3 rounded-full blur-[150px]" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gold/3 rounded-full blur-[180px]" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="inline-block bg-primary/10 text-primary text-sm font-bold px-5 py-2 rounded-full mb-4">
            المواد الدراسية
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-amiri text-foreground mb-4">
            المواد التي نُدرِّسها
            <span className="block text-primary text-3xl md:text-4xl mt-2">في المنصة</span>
          </h2>
          <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
            نقدم منهجًا تعليميًا شاملًا يغطي جميع فروع العلوم الشرعية لطلاب المرحلتين الإعدادية والثانوية الأزهرية
          </p>
        </motion.div>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" staggerDelay={0.08}>
          {subjects.map((subject, index) => (
            <StaggerItem key={index}>
              <motion.div
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
                className={`bg-gradient-to-br ${subject.color} rounded-2xl p-7 border border-border ${subject.borderHover} transition-all duration-300 h-full backdrop-blur-sm hover:shadow-xl group`}
              >
                <div className="w-16 h-16 rounded-2xl bg-card flex items-center justify-center mb-5 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <subject.icon className={`w-8 h-8 ${subject.iconColor}`} />
                </div>
                <h3 className="font-bold text-xl mb-3 text-foreground">{subject.title}</h3>
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
