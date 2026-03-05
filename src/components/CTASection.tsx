import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { GraduationCap, ArrowLeft } from "lucide-react";

const CTASection = () => {
  return (
    <section id="join" className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 hero-gradient" />
      <div className="absolute top-0 left-0 right-0">
        <svg viewBox="0 0 1440 60" fill="none" className="w-full rotate-180">
          <path d="M0 60L1440 60L1440 20C1440 20 1200 0 720 0C240 0 0 20 0 20L0 60Z" fill="hsl(var(--background))" />
        </svg>
      </div>
      
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gold/10 rounded-full blur-[120px]" />

      <div className="container mx-auto px-4 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-xl mx-auto space-y-6"
        >
          <h2 className="text-3xl md:text-4xl font-bold font-amiri text-primary-foreground">
            سارع بالانضمام إلينا
          </h2>
          <p className="text-primary-foreground/70 leading-relaxed">
            انضم الآن إلى منصة الأستاذ إسماعيل أحمد عباده واحصل على شرح مميز في أصول الدين والفقه. سجل حسابك واختر صفك الدراسي وابدأ رحلة التعلم.
          </p>
          <Link to="/auth/register">
            <Button size="lg" className="bg-gold hover:bg-gold-light text-primary font-bold px-10 h-12 text-base shadow-[0_4px_20px_rgba(196,164,75,0.4)] mt-2">
              <GraduationCap className="w-5 h-5 ml-2" />
              سجل الآن مجانًا
              <ArrowLeft className="w-4 h-4 mr-2" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
