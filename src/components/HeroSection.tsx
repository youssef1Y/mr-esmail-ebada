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

          {/* Badge - olive green pill with sparkle ✦ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" as const }}
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
              <span className="text-2xl flex-shrink-0" style={{ color: "hsl(40, 60%, 55%)" }}>✦</span>
            </div>
          </motion.div>

          {/* Title - gold calligraphy */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" as const }}
            className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight text-center"
            style={{ fontFamily: "'Aref Ruqaa', serif", color: "hsl(40, 70%, 50%)" }}
          >
            مِنَصَّةُ الْأُسْتَاذِ
            <br />
            إِسْمَاعِيل أَحْمَد عِبَادَة
          </motion.h1>

          {/* Teacher Image with effects */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" as const }}
            className="relative flex items-center justify-center my-2"
          >
            {/* Green decorative arc */}
            <div
              className="absolute w-52 h-52 md:w-60 md:h-60 rounded-full"
              style={{
                border: "4px solid hsl(152, 40%, 35%)",
                borderRightColor: "transparent",
                borderBottomColor: "transparent",
              }}
            />
            {/* Gold outer ring */}
            <div className="absolute w-48 h-48 md:w-56 md:h-56 rounded-full border-2 border-gold/30" />
            {/* Slow spinning arc */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="absolute w-[13.5rem] h-[13.5rem] md:w-[15.5rem] md:h-[15.5rem] rounded-full"
              style={{
                border: "2px solid transparent",
                borderTopColor: "hsl(var(--gold) / 0.35)",
                borderLeftColor: "hsl(var(--gold) / 0.12)",
              }}
            />
            {/* Glow */}
            <div className="absolute w-40 h-40 md:w-48 md:h-48 rounded-full bg-gold/10 blur-2xl" />
            {/* Image */}
            <div className="w-44 h-44 md:w-52 md:h-52 rounded-full border-[3px] border-gold/60 overflow-hidden shadow-[0_0_40px_-8px_hsl(40,70%,50%,0.3)] relative">
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

          {/* Register Button */}
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

          {/* تعرف علينا */}
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
