import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { GraduationCap, ArrowLeft, Sparkles } from "lucide-react";

const CTASection = () => {
  return (
    <section id="join" className="py-28 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 hero-gradient" />
      <div className="absolute top-0 left-0 right-0">
        <svg viewBox="0 0 1440 60" fill="none" className="w-full rotate-180">
          <path d="M0 60L1440 60L1440 20C1440 20 1200 0 720 0C240 0 0 20 0 20L0 60Z" fill="hsl(var(--background))" />
        </svg>
      </div>
      
      {/* Glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gold/10 rounded-full blur-[120px]" />
      <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-primary-foreground/5 rounded-full blur-[100px]" />

      <div className="container mx-auto px-4 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto space-y-8"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 bg-gold/15 backdrop-blur-md border border-gold/30 rounded-full px-5 py-2"
          >
            <Sparkles className="w-4 h-4 text-gold" />
            <span className="text-gold text-sm font-bold">سجّل الآن واحصل على الدرس الأول مجاناً</span>
          </motion.div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-amiri text-primary-foreground leading-tight">
            سارع بالانضمام
            <br />
            <span className="text-gold">إلى نخبة طلابنا</span>
          </h2>
          <p className="text-primary-foreground/70 leading-relaxed text-base md:text-lg max-w-lg mx-auto">
            انضم الآن إلى منصة الأستاذ إسماعيل أحمد عبادة واحصل على شرح مميز في أصول الدين والفقه. سجل حسابك واختر صفك الدراسي وابدأ رحلة التعلم.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth/register">
              <Button size="lg" className="bg-gold hover:bg-gold-light text-primary font-bold px-12 h-14 text-lg shadow-[0_4px_20px_rgba(196,164,75,0.4)] hover:shadow-[0_6px_30px_rgba(196,164,75,0.5)] transition-all">
                <GraduationCap className="w-5 h-5 ml-2" />
                سجل الآن مجانًا
                <ArrowLeft className="w-4 h-4 mr-2" />
              </Button>
            </Link>
            <a href="https://wa.me/201097602493" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground font-bold h-14 px-8 border-2 border-primary-foreground/40">
                تواصل عبر واتساب
              </Button>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
