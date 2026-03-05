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
          {/* Badge - exact match to reference */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" as const }}
            className="w-full max-w-lg px-2"
          >
            <div
              className="flex items-center justify-between rounded-[18px] px-7 py-5 shadow-xl"
              style={{
                background: "linear-gradient(135deg, hsl(80, 25%, 38%) 0%, hsl(90, 20%, 32%) 40%, hsl(100, 22%, 28%) 100%)",
                border: "1px solid hsla(80, 20%, 50%, 0.25)",
              }}
            >
              <span className="text-base md:text-lg font-bold leading-relaxed" style={{ color: "hsl(36, 30%, 93%)" }}>
                منصة تعليمية متخصصة في العلوم الشرعية
              </span>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 mr-3 opacity-80">
                <path d="M12 2L14.5 8.5L21 9.5L16.5 14L17.5 21L12 17.5L6.5 21L7.5 14L3 9.5L9.5 8.5L12 2Z" fill="hsl(40, 70%, 50%)" fillOpacity="0.6" />
                <path d="M12 5L9 11L3 12L7.5 16L6.5 22L12 18.5L17.5 22L16.5 16L21 12L15 11L12 5Z" stroke="hsl(40, 70%, 50%)" strokeWidth="0.5" fill="none" opacity="0.4" />
              </svg>
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

          {/* Teacher Image - clean elegant design */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" as const }}
            className="relative flex items-center justify-center my-2"
          >
            {/* Outer static ring */}
            <div className="absolute w-44 h-44 md:w-52 md:h-52 rounded-full border-2 border-gold/25" />
            {/* Middle arc - slow spin */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="absolute w-48 h-48 md:w-56 md:h-56 rounded-full"
              style={{
                border: "2px solid transparent",
                borderTopColor: "hsl(var(--gold) / 0.4)",
                borderRightColor: "hsl(var(--gold) / 0.15)",
              }}
            />
            {/* Soft glow behind */}
            <div className="absolute w-36 h-36 md:w-44 md:h-44 rounded-full bg-gold/10 blur-2xl" />
            {/* Image container */}
            <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-full border-[3px] border-gold/50 overflow-hidden shadow-[0_0_40px_-10px_hsl(var(--gold)/0.3)]">
              <img src={teacherImg} alt="الأستاذ إسماعيل أحمد عباده" className="w-full h-full object-cover" />
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
