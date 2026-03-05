import { Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import teacherImg from "@/assets/teacher.jpg";
import islamicPattern from "@/assets/islamic-pattern.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background with Islamic pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 hero-gradient" />
        <img
          src={islamicPattern}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-[0.06] mix-blend-overlay"
        />
      </div>

      <div className="container mx-auto px-4 relative z-10 pt-20 pb-16">
        <div className="flex flex-col items-center gap-6">
          {/* Teacher Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-36 h-36 md:w-44 md:h-44 rounded-full border-4 border-gold overflow-hidden shadow-lg">
              <img src={teacherImg} alt="الأستاذ إسماعيل أحمد عباده" className="w-full h-full object-cover" />
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center space-y-4 max-w-2xl"
          >
            <h1
              className="text-3xl md:text-5xl font-bold text-gold leading-[1.5]"
              style={{ fontFamily: "'Aref Ruqaa', serif" }}
            >
              مِنَصَّةُ الْأُسْتَاذِ
              <br />
              إِسْمَاعِيل أَحْمَد عِبَادَة
            </h1>

            <p className="text-primary-foreground/80 text-sm md:text-base leading-relaxed max-w-lg mx-auto">
              مُعِدُّ ومُراجعُ كتاب المرشد الأزهري | صاحبُ سلسلةِ الأزهريّ في العلومِ الشرعيةِ
            </p>
          </motion.div>

          {/* Subject tags */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-2 max-w-md"
          >
            {["الفقه الشافعي", "الفقه المالكي", "الفقه الحنفي", "التوحيد", "التفسير", "الحديث", "السيرة"].map((subject) => (
              <span
                key={subject}
                className="bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground/80 text-xs px-3 py-1.5 rounded-full"
              >
                {subject}
              </span>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-3 mt-2"
          >
            <Link to="/auth/register">
              <Button size="lg" className="bg-gold hover:bg-gold-light text-primary font-bold px-10 h-12 text-base shadow-md">
                <GraduationCap className="w-5 h-5 ml-2" />
                سجل الآن مجانًا
              </Button>
            </Link>
            <a href="#about">
              <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 font-bold h-12 px-8">
                تعرف علينا
              </Button>
            </a>
          </motion.div>
        </div>
      </div>

      {/* Bottom curve */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 50" fill="none" className="w-full">
          <path d="M0 50L1440 50L1440 15C1440 15 1200 0 720 0C240 0 0 15 0 15L0 50Z" fill="hsl(var(--background))" />
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;
