import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import islamicPattern from "@/assets/islamic-pattern.jpg";
import teacherImg from "@/assets/teacher.jpg";

const subjects = ["الفقه الشافعي", "الفقه المالكي", "الفقه الحنفي", "التوحيد", "التفسير", "الحديث", "السيرة"];

const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={islamicPattern} alt="" className="w-full h-full object-cover opacity-15" />
        <div className="absolute inset-0 hero-gradient opacity-92" />
      </div>

      <div className="container mx-auto px-4 relative z-10 pt-20 pb-10">
        <div className="flex flex-col items-center gap-6">

          {/* Teacher Image with green arc + gold ring - like reference */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" as const }}
            className="relative w-48 h-48 md:w-56 md:h-56"
          >
            {/* Green decorative arc (half circle on left) */}
            <div
              className="absolute inset-[-8px] rounded-full"
              style={{
                border: "4px solid hsl(152, 40%, 35%)",
                borderRightColor: "transparent",
                borderBottomColor: "transparent",
              }}
            />
            {/* Gold circle border */}
            <div className="absolute inset-0 rounded-full border-[3px] border-gold/70 shadow-[0_0_30px_-5px_hsl(40,70%,50%,0.25)]" />
            {/* Image */}
            <div className="absolute inset-[3px] rounded-full overflow-hidden">
              <img src={teacherImg} alt="الأستاذ إسماعيل أحمد عباده" className="w-full h-full object-cover" />
            </div>
          </motion.div>

          {/* Badge - olive green gradient pill like reference */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" as const }}
            className="w-full max-w-md md:max-w-lg"
          >
            <div
              className="flex items-center rounded-2xl px-6 py-4 gap-3"
              style={{
                background: "linear-gradient(to left, hsl(75, 30%, 33%), hsl(85, 25%, 37%), hsl(70, 28%, 40%))",
                boxShadow: "0 8px 24px -6px hsla(80, 30%, 20%, 0.5)",
              }}
            >
              <p className="text-sm md:text-base font-bold leading-relaxed flex-1" style={{ color: "hsl(40, 30%, 90%)" }}>
                منصة تعليمية متخصصة في العلوم الشرعية
              </p>
              {/* Islamic star icon */}
              <svg width="30" height="30" viewBox="0 0 32 32" fill="none" className="flex-shrink-0">
                <path d="M16 4L18.5 12.5H27L20 17.5L22.5 26L16 21L9.5 26L12 17.5L5 12.5H13.5L16 4Z" fill="hsl(40, 60%, 55%)" fillOpacity="0.5" />
                <circle cx="16" cy="16" r="3" fill="hsl(40, 60%, 55%)" fillOpacity="0.3" />
                <path d="M16 6L13 14H6L11.5 18L9.5 25.5L16 20.5L22.5 25.5L20.5 18L26 14H19L16 6Z" stroke="hsl(40, 60%, 55%)" strokeWidth="0.5" fill="none" opacity="0.3" />
              </svg>
            </div>
          </motion.div>

          {/* Title - gold calligraphy */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25, ease: "easeOut" as const }}
            className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight text-center"
            style={{ fontFamily: "'Aref Ruqaa', serif", color: "hsl(40, 70%, 50%)" }}
          >
            مِنَصَّةُ الْأُسْتَاذِ
            <br />
            إِسْمَاعِيل أَحْمَد عِبَادَة
          </motion.h1>

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
            className="flex flex-wrap justify-center gap-2 max-w-md"
          >
            {subjects.map((s) => (
              <span
                key={s}
                className="text-xs md:text-sm rounded-full px-3.5 py-1.5"
                style={{
                  border: "1px solid hsla(80, 20%, 50%, 0.3)",
                  color: "hsl(40, 20%, 80%)",
                }}
              >
                {s}
              </span>
            ))}
          </motion.div>

          {/* Register Button - gold/yellow */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" as const }}
          >
            <Link to="/auth/register">
              <Button size="lg" className="bg-gold hover:bg-gold-light text-primary font-bold px-12 text-base rounded-xl">
                سجل الآن مجانًا
              </Button>
            </Link>
          </motion.div>

          {/* تعرف علينا - subtle muted button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45, ease: "easeOut" as const }}
          >
            <a href="#about">
              <button
                className="px-8 py-2.5 rounded-xl text-sm font-bold transition-colors"
                style={{
                  border: "1px solid hsla(40, 20%, 60%, 0.3)",
                  color: "hsl(40, 15%, 65%)",
                  background: "hsla(40, 10%, 50%, 0.08)",
                }}
              >
                تعرف علينا
              </button>
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
