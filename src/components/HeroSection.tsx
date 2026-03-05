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
          {/* Badge - styled like reference with gradient bg */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" as const }}
            className="w-full max-w-md"
          >
            <div className="flex items-center gap-3 bg-gradient-to-l from-gold/20 via-primary-foreground/10 to-gold/20 backdrop-blur-md border border-gold/40 rounded-2xl px-6 py-4 text-primary-foreground shadow-lg">
              <span className="text-gold text-lg">✦</span>
              <span className="text-sm md:text-base font-bold">منصة تعليمية متخصصة في العلوم الشرعية</span>
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

          {/* Teacher Image with radiating circles */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" as const }}
            className="relative flex items-center justify-center"
          >
            {/* Radiating circles */}
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                animate={{ scale: [1, 1.8, 2.2], opacity: [0.25, 0.08, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 0.8, ease: "easeOut" }}
                className="absolute w-40 h-40 md:w-48 md:h-48 rounded-full border border-gold/40"
              />
            ))}
            {/* Static decorative rings */}
            <div className="absolute w-48 h-48 md:w-56 md:h-56 rounded-full border border-gold/15" />
            <div className="absolute w-56 h-56 md:w-64 md:h-64 rounded-full border border-gold/8" />
            {/* Spinning dashed ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute w-52 h-52 md:w-60 md:h-60 rounded-full border-2 border-dashed border-gold/20"
            />
            {/* Glow */}
            <div className="absolute w-40 h-40 md:w-48 md:h-48 rounded-full bg-gold/15 blur-3xl" />
            {/* Image */}
            <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-full border-[3px] border-gold/60 overflow-hidden shadow-2xl">
              <img src={teacherImg} alt="الأستاذ إسماعيل أحمد عباده" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-primary-foreground/5" />
            </div>
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

          {/* تعرف علينا - gold outline style */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45, ease: "easeOut" as const }}
          >
            <a href="#about">
              <Button size="lg" variant="outline" className="border-gold/50 text-gold hover:bg-gold/10 hover:text-gold font-bold px-8">
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
