import { motion } from "framer-motion";
import { Shield, Clock, Award, HeartHandshake } from "lucide-react";
import { StaggerContainer, StaggerItem } from "./StaggerAnimation";

const reasons = [
  {
    icon: Shield,
    title: "منهج أزهري معتمد",
    description: "محتوى علمي دقيق مُعتمد من كتاب المرشد الأزهري ومراجع العلوم الشرعية",
  },
  {
    icon: Clock,
    title: "تعلّم في أي وقت",
    description: "شاهد الدروس وحلّ الامتحانات في أي وقت ومن أي مكان يناسبك",
  },
  {
    icon: Award,
    title: "نتائج مضمونة",
    description: "طلابنا يحققون نتائج متميزة بفضل أسلوب الشرح المبسط والمتابعة المستمرة",
  },
  {
    icon: HeartHandshake,
    title: "دعم مستمر",
    description: "تواصل مباشر مع المعلم والمتابعة الدورية لمستوى كل طالب على حدة",
  },
];

const WhyUsSection = () => {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-primary/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-accent/5 rounded-full blur-[100px]" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <span className="inline-block bg-accent/10 text-accent text-sm font-bold px-4 py-1.5 rounded-full mb-4">
            لماذا تختارنا؟
          </span>
          <h2 className="text-3xl md:text-4xl font-bold font-amiri text-foreground mb-4">
            ما يميزنا عن غيرنا
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            نوفر تجربة تعليمية فريدة تجمع بين الأصالة والتقنية الحديثة
          </p>
        </motion.div>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto" staggerDelay={0.1}>
          {reasons.map((reason, index) => (
            <StaggerItem key={index}>
              <motion.div
                whileHover={{ y: -3, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="bg-card rounded-2xl p-6 border border-border hover:border-primary/30 transition-all duration-300 flex gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center flex-shrink-0">
                  <reason.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-base mb-1.5 text-foreground">{reason.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{reason.description}</p>
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
};

export default WhyUsSection;
