import { Link } from "react-router-dom";
import { BookOpen, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import islamicPattern from "@/assets/islamic-pattern.jpg";
import teacherImg from "@/assets/teacher.jpg";

const subjects = ["الفقه الشافعي", "الفقه المالكي", "الفقه الحنفي", "التوحيد", "التفسير", "الحديث", "السيرة"];

const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background with Islamic pattern showing through */}
      <div className="absolute inset-0">
        <img src={islamicPattern} alt="" className="w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 hero-gradient opacity-90" />
      </div>

      {/* Subtle Islamic geometric SVG overlay */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className="container mx-auto px-4 relative z-10 pt-20 pb-10">
        <div className="flex flex-col items-center gap-5">
          {/* Badge - above image */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" as const }}
            className="w-full max-w-md"
          >
            <div className="flex items-center gap-3 bg-primary-foreground/10 backdrop-blur-sm border border-gold/30 rounded-2xl px-5 py-3 text-primary-foreground">
              <BookOpen className="w-5 h-5 text-gold flex-shrink-0" />
              <span className="text-sm md:text-base font-medium">منصة تعليمية متخصصة في العلوم الشرعية</span>
            </div>
          </motion.div>

          {/* Title - above image */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" as const }}
            className="text-3xl md:text-5xl lg:text-6xl font-bold text-gold leading-tight text-center"
            style={{ fontFamily: "'Aref Ruqaa', serif" }}
          >
            مِنَصَّةُ الْأُسْتَاذِ إِسْمَاعِيل أَحْمَد عِبَادَة
          </motion.h1>

          {/* Teacher Image with gold ring */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" as const }}
            className="relative"
          >
            <div className="w-52 h-52 md:w-64 md:h-64 rounded-full border-4 border-gold/60 overflow-hidden shadow-2xl ring-4 ring-primary-foreground/10 ring-offset-4 ring-offset-transparent">
              <img src={teacherImg} alt="الأستاذ إسماعيل أحمد عباده" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -inset-4 rounded-full bg-gold/10 blur-2xl -z-10" />
          </motion.div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" as const }}
            className="text-primary-foreground/80 text-sm md:text-base max-w-xl mx-auto leading-relaxed text-center"
          >
            مُعِدُّ ومُراجعُ كتاب المرشد الأزهري | صاحبُ سلسلةِ الأزهريّ في العلومِ الشرعيةِ
          </motion.p>

          {/* Subject tags */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35, ease: "easeOut" as const }}
            className="flex flex-wrap justify-center gap-2 max-w-lg"
          >
            {subjects.map((s) => (
              <span key={s} className="text-xs md:text-sm border border-primary-foreground/20 text-primary-foreground/70 rounded-full px-3 py-1.5 backdrop-blur-sm">
                {s}
              </span>
            ))}
          </motion.div>

          {/* Register Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" as const }}
          >
            <Link to="/auth/register">
              <Button size="lg" className="bg-gold hover:bg-gold-light text-primary font-bold px-10 text-base">
                سجل الآن مجانًا
              </Button>
            </Link>
          </motion.div>

          {/* تعرف علينا - centered, different style */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45, ease: "easeOut" as const }}
          >
            <a href="#about">
              <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground font-bold px-8">
                تعرف علينا
              </Button>
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
