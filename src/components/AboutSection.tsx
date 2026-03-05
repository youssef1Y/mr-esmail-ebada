import { BookOpen, Heart, Target, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { StaggerContainer, StaggerItem } from "./StaggerAnimation";

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
    <section id="about" className="py-20 bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gold/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <span className="inline-block bg-primary/10 text-primary text-sm font-bold px-4 py-1.5 rounded-full mb-4">
            تعرف علينا
          </span>
          <h2 className="text-3xl md:text-4xl font-bold font-amiri text-foreground mb-4">من نحن</h2>
          <p className="text-muted-foreground leading-relaxed">
            المِنَصَّةُ مُتَخَصِّصَةٌ فِي: تَعْلِيمِ الفِقْهِ الشّافِعِيِّ، وَ المَالِكِيِّ، وَ الْحَنَفِيِّ، وَ أُصُولِ الدِّينِ (التَّوْحِيدِ– التَّفْسِيرِ– الْحَدِيثِ– السِّيرَةِ). نَسْعَى لِتَقْدِيمِ مُحْتَوَى تَعْلِيمِيٍّ مُكْتَمِلِ الْجَوَانِبِ؛ لِتَرْسِيخِ فَهْمِ الدِّينِ فِي نُفُوسِ الطُّلَّابِ.
          </p>
        </motion.div>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" staggerDelay={0.12}>
          {features.map((feature, index) => (
            <StaggerItem key={index}>
              <div className="bg-card rounded-xl p-6 text-center border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg h-full">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
};

export default AboutSection;
