import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Users, ShieldCheck, BarChart3, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: BarChart3, text: "تقدم المواد والنتائج" },
  { icon: Bell, text: "الواجبات والامتحانات المتأخرة" },
  { icon: ShieldCheck, text: "تسجيل آمن بكود تحقق SMS" },
];

const ParentSection = () => {
  return (
    <section className="py-16 bg-gradient-to-b from-background to-card/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          <div className="bg-card rounded-2xl border border-border p-6 md:p-8 relative overflow-hidden">
            {/* Decorative */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-primary/5 rounded-full translate-x-1/2 translate-y-1/2" />

            <div className="relative z-10 text-center">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold font-amiri text-foreground mb-2">
                هل أنت ولي أمر؟
              </h2>
              <p className="text-muted-foreground text-sm md:text-base mb-6 max-w-lg mx-auto">
                تابع أداء ابنك الدراسي مباشرة — نتائج الامتحانات والواجبات وتقدمه في كل مادة
              </p>

              <div className="flex flex-wrap justify-center gap-4 mb-6">
                {features.map((f, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 * i }}
                    className="flex items-center gap-2 bg-muted/50 rounded-full px-3 py-1.5"
                  >
                    <f.icon className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium">{f.text}</span>
                  </motion.div>
                ))}
              </div>

              <Link to="/parent/login">
                <Button size="lg" className="px-8">
                  <Users className="w-4 h-4 ml-2" />
                  دخول ولي الأمر
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ParentSection;
