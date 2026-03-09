import { motion } from "framer-motion";
import { useMemo } from "react";

/** Floating Islamic geometric shapes for hero background */
const IslamicParticles = () => {
  const particles = useMemo(() => 
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      size: 8 + Math.random() * 20,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: 15 + Math.random() * 20,
      delay: Math.random() * 8,
      opacity: 0.04 + Math.random() * 0.08,
      rotation: Math.random() * 360,
      shape: i % 3, // 0=star, 1=octagon, 2=diamond
    })), []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [0, -30, 0, 20, 0],
            x: [0, 15, -10, 5, 0],
            rotate: [p.rotation, p.rotation + 90, p.rotation + 180, p.rotation + 270, p.rotation + 360],
            scale: [1, 1.2, 0.9, 1.1, 1],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {p.shape === 0 && (
            // 8-pointed star
            <svg viewBox="0 0 24 24" fill="none" style={{ opacity: p.opacity }}>
              <path
                d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z"
                fill="hsl(var(--gold))"
              />
            </svg>
          )}
          {p.shape === 1 && (
            // Octagon
            <svg viewBox="0 0 24 24" fill="none" style={{ opacity: p.opacity }}>
              <polygon
                points="7,0 17,0 24,7 24,17 17,24 7,24 0,17 0,7"
                fill="none"
                stroke="hsl(var(--primary-foreground))"
                strokeWidth="1"
              />
            </svg>
          )}
          {p.shape === 2 && (
            // Diamond
            <svg viewBox="0 0 24 24" fill="none" style={{ opacity: p.opacity }}>
              <path
                d="M12 0L24 12L12 24L0 12Z"
                fill="none"
                stroke="hsl(var(--gold))"
                strokeWidth="0.8"
              />
              <path
                d="M12 4L20 12L12 20L4 12Z"
                fill="none"
                stroke="hsl(var(--gold))"
                strokeWidth="0.5"
              />
            </svg>
          )}
        </motion.div>
      ))}
    </div>
  );
};

export default IslamicParticles;
