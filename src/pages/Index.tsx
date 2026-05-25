import { motion } from "framer-motion";
import { useMemo } from "react";

const Index = () => {
  const sparkles = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 4 + Math.random() * 10,
        delay: Math.random() * 4,
        duration: 3 + Math.random() * 4,
      })),
    []
  );

  const orbs = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 200 + Math.random() * 300,
        delay: Math.random() * 5,
      })),
    []
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a0612] flex items-center justify-center">
      {/* Gradient backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(45_70%_15%)_0%,_#0a0612_60%)]" />

      {/* Floating glow orbs */}
      {orbs.map((o) => (
        <motion.div
          key={o.id}
          className="absolute rounded-full blur-3xl"
          style={{
            left: `${o.x}%`,
            top: `${o.y}%`,
            width: o.size,
            height: o.size,
            background:
              "radial-gradient(circle, hsl(45 90% 55% / 0.25) 0%, transparent 70%)",
          }}
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -30, 20, 0],
            scale: [1, 1.15, 0.9, 1],
          }}
          transition={{
            duration: 14,
            delay: o.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Sparkles */}
      {sparkles.map((s) => (
        <motion.div
          key={s.id}
          className="absolute"
          style={{ left: `${s.x}%`, top: `${s.y}%` }}
          animate={{ opacity: [0, 1, 0], scale: [0.3, 1.2, 0.3] }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="none">
            <path
              d="M12 0L13.5 10.5L24 12L13.5 13.5L12 24L10.5 13.5L0 12L10.5 10.5Z"
              fill="hsl(45 95% 65%)"
            />
          </svg>
        </motion.div>
      ))}

      {/* Decorative top ornament */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.2 }}
        className="absolute top-12 left-1/2 -translate-x-1/2 flex items-center gap-3"
      >
        <span className="h-px w-12 bg-gradient-to-r from-transparent to-[hsl(45_90%_60%)]" />
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2L14 10L22 12L14 14L12 22L10 14L2 12L10 10Z"
            fill="hsl(45 90% 60%)"
          />
        </svg>
        <span className="h-px w-12 bg-gradient-to-l from-transparent to-[hsl(45_90%_60%)]" />
      </motion.div>

      {/* The Name */}
      <div className="relative z-10 text-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.7, filter: "blur(20px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1
            className="text-6xl sm:text-8xl md:text-9xl font-bold tracking-wide leading-none"
            style={{
              fontFamily: "'Cormorant Garamond', 'Aref Ruqaa', serif",
              fontStyle: "italic",
              background:
                "linear-gradient(135deg, #f7e9b0 0%, #e8c468 25%, #fff4cf 50%, #c9a14a 75%, #f7e9b0 100%)",
              backgroundSize: "200% 200%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 0 40px hsl(45 90% 55% / 0.5))",
            }}
          >
            <motion.span
              className="inline-block"
              animate={{ backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"] }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              style={{
                background: "inherit",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
              }}
            >
              Maijetsui
            </motion.span>
          </h1>
        </motion.div>

        {/* Underline flourish */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.8, ease: "easeOut" }}
          className="mt-6 mx-auto h-px w-64 bg-gradient-to-r from-transparent via-[hsl(45_90%_60%)] to-transparent"
        />

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 0.7, y: 0 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="mt-4 text-[hsl(45_50%_75%)] tracking-[0.4em] text-xs uppercase"
        >
          ·  ·  ·
        </motion.p>
      </div>

      {/* Decorative bottom ornament */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-3"
      >
        <span className="h-px w-12 bg-gradient-to-r from-transparent to-[hsl(45_90%_60%)]" />
        <div className="w-2 h-2 rotate-45 bg-[hsl(45_90%_60%)]" />
        <span className="h-px w-12 bg-gradient-to-l from-transparent to-[hsl(45_90%_60%)]" />
      </motion.div>
    </main>
  );
};

export default Index;
