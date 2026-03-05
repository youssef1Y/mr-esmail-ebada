import { Link } from "react-router-dom";
import { BookOpen, Users, GraduationCap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import teacherImg from "@/assets/teacher.jpg";
import islamicPattern from "@/assets/islamic-pattern.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-[100vh] flex items-center overflow-hidden">
      {/* Layered Background */}
      <div className="absolute inset-0 hero-gradient" />
      
      {/* Islamic pattern background overlay */}
      <div 
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: `url(${islamicPattern})`,
          backgroundSize: '400px 400px',
          backgroundRepeat: 'repeat',
          mixBlendMode: 'soft-light',
        }}
      />

      {/* Glow effects */}
      <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-gold/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-primary-foreground/5 rounded-full blur-[120px]" />

      <div className="container mx-auto px-4 relative z-10 pt-24 pb-12">
        <div className="flex flex-col items-center gap-6 md:gap-8">
          
          {/* 1. Badge on top */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-2 bg-gold/15 backdrop-blur-md border border-gold/30 rounded-full px-5 py-2"
          >
            <Sparkles className="w-4 h-4 text-gold" />
            <span className="text-gold text-sm font-bold">منصة متخصصة في العلوم الشرعية</span>
          </motion.div>

          {/* 2. Platform name */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center space-y-3 max-w-2xl"
          >
            <h1 
              className="text-3xl md:text-5xl lg:text-[3.5rem] font-bold text-gold leading-[1.4] tracking-wide"
              style={{ fontFamily: "'Aref Ruqaa', serif" }}
            >
              مِنَصَّةُ الْأُسْتَاذِ
              <br />
              إِسْمَاعِيل أَحْمَد عِبَادَة
            </h1>
            <p className="text-primary-foreground/75 text-sm md:text-base leading-relaxed max-w-lg mx-auto">
              مُعِدُّ ومُراجعُ كتاب المرشد الأزهري | صاحبُ سلسلةِ الأزهريّ في العلومِ الشرعيةِ
            </p>
          </motion.div>

          {/* 3. Teacher Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.5, ease: "easeOut" }}
            className="relative flex items-center justify-center"
          >
            {/* Ripple rings that expand outward and fade */}
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute rounded-full border border-gold/40"
                style={{ width: '160px', height: '160px' }}
                animate={{
                  scale: [1, 1.8, 2.5],
                  opacity: [0.5, 0.2, 0],
                }}
                transition={{
                  duration: 3,
                  delay: i * 1,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
              />
            ))}
            {/* Static decorative ring */}
            <div className="absolute w-[170px] h-[170px] md:w-[210px] md:h-[210px] rounded-full border border-gold/20" />
            {/* Image with subtle breathing scale */}
            <motion.div
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="w-36 h-36 md:w-44 md:h-44 rounded-full border-[3px] border-gold overflow-hidden shadow-[0_0_40px_rgba(196,164,75,0.3)]"
            >
              <img src={teacherImg} alt="الأستاذ إسماعيل أحمد عباده" className="w-full h-full object-cover" />
            </motion.div>
          </motion.div>

          {/* Subject pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex flex-wrap justify-center gap-2 max-w-lg"
          >
            {["الفقه الشافعي", "الفقه المالكي", "الفقه الحنفي", "التوحيد", "التفسير", "الحديث", "السيرة"].map((subject, i) => (
              <motion.span
                key={subject}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.7 + i * 0.05 }}
                className="bg-primary-foreground/8 backdrop-blur-sm border border-primary-foreground/15 text-primary-foreground/80 text-xs px-3 py-1.5 rounded-full"
              >
                {subject}
              </motion.span>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="flex flex-col sm:flex-row items-center gap-3"
          >
            <Link to="/auth/register">
              <Button size="lg" className="bg-gold hover:bg-gold-light text-primary font-bold px-10 h-12 text-base shadow-[0_4px_20px_rgba(196,164,75,0.4)] hover:shadow-[0_6px_30px_rgba(196,164,75,0.5)] transition-all">
                <GraduationCap className="w-5 h-5 ml-2" />
                سجل الآن مجانًا
              </Button>
            </Link>
            <a href="#about">
              <Button size="lg" className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground font-bold h-12 px-8 border-2 border-primary-foreground/40">
                تعرف علينا
              </Button>
            </a>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1 }}
            className="flex items-center gap-8 text-primary-foreground/60 text-sm mt-2"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-foreground/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-gold" />
              </div>
              <span>+500 طالب</span>
            </div>
            <div className="w-px h-6 bg-primary-foreground/20" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-foreground/10 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-gold" />
              </div>
              <span>مناهج معتمدة</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom curve */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 60" fill="none" className="w-full">
          <path d="M0 60L1440 60L1440 20C1440 20 1200 0 720 0C240 0 0 20 0 20L0 60Z" fill="hsl(var(--background))" />
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;
