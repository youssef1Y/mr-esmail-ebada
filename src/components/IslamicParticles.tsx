import { useMemo } from "react";

/** Lightweight CSS-only Islamic geometric shapes for hero background */
const IslamicParticles = () => {
  const particles = useMemo(() => 
    Array.from({ length: 6 }, (_, i) => ({
      id: i,
      size: 10 + Math.random() * 16,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: 20 + Math.random() * 15,
      delay: Math.random() * 5,
      opacity: 0.04 + Math.random() * 0.06,
    })), []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-float-slow"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        >
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z"
              fill="hsl(var(--gold))"
            />
          </svg>
        </div>
      ))}
    </div>
  );
};

export default IslamicParticles;
