import { motion } from "framer-motion";
import { Shield, Clock, Award, HeartHandshake, CheckCircle } from "lucide-react";
import { StaggerContainer, StaggerItem } from "./StaggerAnimation";

const reasons = [
  {
    icon: Shield,
    title: "منهج أزهري معتمد",
    description: "محتوى علمي دقيق مُعتمد من كتاب المرشد الأزهري ومراجع العلوم الشرعية",
    number: "01",
  },
  {
    icon: Clock,
    title: "تعلّم في أي وقت",
    description: "شاهد الدروس وحلّ الامتحانات في أي وقت ومن أي مكان يناسبك",
    number: "02",
  },
  {
    icon: Award,
    title: "نتائج مضمونة",
    description: "طلابنا يحققون نتائج متميزة بفضل أسلوب الشرح المبسط والمتابعة المستمرة",
    number: "03",
  },
  {
    icon: HeartHandshake,
    title: "دعم مستمر",
    description: "تواصل مباشر مع المعلم والمتابعة الدورية لمستوى كل طالب على حدة",
    number: "04",
  },
];

const WhyUsSection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-[150px]" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-accent/5 rounded-full blur-[120px]" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="inline-block bg-accent/10 text-accent text-sm font-bold px-5 py-2 rounded-full mb-4">
            لماذا تختارنا؟
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-amiri text-foreground mb-4">
            ما يميزنا
            <span className="block text-primary text-3xl md:text-4xl mt-2">عن غيرنا</span>
          </h2>
          <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
            نوفر تجربة تعليمية فريدة تجمع بين الأصالة والتقنية الحديثة
          </p>
        </motion.div>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto" staggerDelay={0.1}>
          {reasons.map((reason, index) => (
            <StaggerItem key={index}>
              <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="bg-card rounded-2xl p-7 border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 flex gap-5 relative overflow-hidden group"
              >
                {/* Number watermark */}
                <span className="absolute top-2 left-2 text-6xl font-bold text-primary/5 group-hover:text-primary/10 transition-colors">{reason.number}</span>
                
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center flex-shrink-0">
                  <reason.icon className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2 text-foreground">{reason.title}</h3>
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
