import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Video, Trophy, ClipboardList, ChevronLeft,
  Sparkles, Star, Bell, Users, MessageCircle, Shield,
  GraduationCap, Rocket
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const steps = [
  {
    icon: Sparkles,
    title: "مرحباً بك في المنصة! 🎉",
    description: "منصة الأستاذ إسماعيل أحمد عباده لتعليم العلوم الشرعية. رحلتك التعليمية تبدأ من هنا!",
    color: "from-primary to-primary/60",
    particles: ["✨", "🌟", "⭐"],
  },
  {
    icon: Video,
    title: "فيديوهات تعليمية احترافية",
    description: "شاهد شروحات مفصلة لكل الدروس بجودة عالية. شرح مبسّط يساعدك تفهم أسرع وتحفظ أكتر.",
    color: "from-blue-500 to-cyan-400",
    particles: ["🎬", "📺", "🎥"],
  },
  {
    icon: ClipboardList,
    title: "امتحانات وواجبات إلكترونية",
    description: "حل الامتحانات والواجبات أونلاين واحصل على تقييم فوري. تعرف غلطاتك وصحّحها على طول!",
    color: "from-emerald-500 to-green-400",
    particles: ["📝", "✅", "📋"],
  },
  {
    icon: Trophy,
    title: "نقاط ومنافسة حماسية",
    description: "اجمع نقاط مع كل امتحان وواجب تحلّه. نافس زملاءك وطلّع اسمك في لوحة المتصدرين!",
    color: "from-amber-500 to-yellow-400",
    particles: ["🏆", "🥇", "🎯"],
  },
  {
    icon: Bell,
    title: "إشعارات وتنبيهات",
    description: "هتوصلك إشعارات بالمواعيد الجديدة والامتحانات والأخبار المهمة عشان ما يفوتك حاجة.",
    color: "from-rose-500 to-pink-400",
    particles: ["🔔", "📢", "💬"],
  },
  {
    icon: Users,
    title: "متابعة ولي الأمر",
    description: "ولي الأمر يقدر يتابع مستواك ونتائجك أول بأول من خلال حساب خاص بيه.",
    color: "from-violet-500 to-purple-400",
    particles: ["👨‍👩‍👦", "📊", "👀"],
  },
  {
    icon: Rocket,
    title: "يلّا نبدأ! 🚀",
    description: "أنت جاهز تبدأ رحلتك! ادخل الداشبورد واستكشف كل المميزات. بالتوفيق والنجاح!",
    color: "from-primary to-accent",
    particles: ["🚀", "💪", "🎓"],
  },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth/login", { replace: true });
      } else {
        setChecked(true);
      }
    });
  }, [navigate]);

  const finish = () => {
    localStorage.setItem("onboarding_done", "true");
    navigate("/dashboard", { replace: true });
  };

  const next = () => {
    if (current < steps.length - 1) setCurrent(c => c + 1);
    else finish();
  };

  const prev = () => {
    if (current > 0) setCurrent(c => c - 1);
  };

  if (!checked) return <div className="min-h-screen bg-background" />;

  const step = steps[current];
  const isLast = current === steps.length - 1;
  const isFirst = current === 0;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Animated background blobs */}
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.15, 0.3, 0.15],
          x: [0, 30, 0],
          y: [0, -20, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-25%] right-[-20%] w-[600px] h-[600px] rounded-full bg-primary/10 blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.25, 0.1],
          x: [0, -20, 0],
          y: [0, 30, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-25%] left-[-20%] w-[500px] h-[500px] rounded-full bg-accent/10 blur-3xl"
      />

      {/* Floating particles */}
      {step.particles.map((p, i) => (
        <motion.span
          key={`${current}-${i}`}
          initial={{ opacity: 0, y: 50, x: (i - 1) * 80 }}
          animate={{
            opacity: [0, 0.6, 0],
            y: [50, -100],
            x: [(i - 1) * 80, (i - 1) * 100],
          }}
          transition={{ duration: 3, delay: i * 0.5, repeat: Infinity }}
          className="absolute text-3xl pointer-events-none"
          style={{ top: "40%", left: "50%" }}
        >
          {p}
        </motion.span>
      ))}

      <div className="w-full max-w-md relative z-10">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-muted-foreground font-medium">
              {current + 1} / {steps.length}
            </span>
            <span className="text-xs text-muted-foreground">
              {Math.round(((current + 1) / steps.length) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-l from-primary to-accent rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((current + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => setCurrent(i)}
              animate={{
                width: i === current ? 28 : 8,
                opacity: i === current ? 1 : i < current ? 0.6 : 0.3,
              }}
              whileHover={{ scale: 1.2 }}
              className={`h-2 rounded-full transition-colors cursor-pointer ${
                i === current
                  ? "bg-primary"
                  : i < current
                  ? "bg-primary/50"
                  : "bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>

        {/* Content card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 40, scale: 0.92, rotateX: 10 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
            exit={{ opacity: 0, y: -40, scale: 0.92, rotateX: -10 }}
            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
            className="text-center"
          >
            {/* Icon with animated rings and glow */}
            <div className="relative flex items-center justify-center mb-10">
              {/* Glow effect */}
              <motion.div
                animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.8, 1, 0.8] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className={`absolute w-40 h-40 rounded-full bg-gradient-to-br ${step.color} blur-2xl opacity-20`}
              />
              {/* Animated rings */}
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="absolute rounded-3xl border border-primary/15"
                  style={{ width: 110 + i * 28, height: 110 + i * 28 }}
                  animate={{
                    scale: [1, 1.15, 1],
                    opacity: [0.4, 0.05, 0.4],
                    rotate: [0, i % 2 === 0 ? 5 : -5, 0],
                  }}
                  transition={{ duration: 3.5, delay: i * 0.4, repeat: Infinity }}
                />
              ))}
              {/* Main icon */}
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 180, damping: 12 }}
                className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-2xl relative z-10`}
              >
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <step.icon className="w-12 h-12 text-white" />
                </motion.div>
              </motion.div>
            </div>

            {/* Title with letter animation */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="text-2xl md:text-3xl font-bold font-amiri mb-4"
            >
              {step.title}
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="text-muted-foreground leading-relaxed max-w-sm mx-auto text-base"
            >
              {step.description}
            </motion.p>

            {/* Welcome stars on first step */}
            {isFirst && (
              <div className="flex justify-center gap-1.5 mt-5">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0, rotate: -180 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{
                      delay: 0.5 + i * 0.12,
                      type: "spring",
                      stiffness: 200,
                    }}
                  >
                    <Star className="w-5 h-5 text-accent fill-accent" />
                  </motion.div>
                ))}
              </div>
            )}

            {/* Celebration on last step */}
            {isLast && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, type: "spring" }}
                className="mt-5 flex justify-center"
              >
                <div className="flex items-center gap-2 bg-accent/10 text-accent rounded-full px-4 py-2">
                  <GraduationCap className="w-5 h-5" />
                  <span className="text-sm font-bold">أنت جاهز للنجاح!</span>
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mt-12 flex flex-col gap-3"
        >
          <Button
            onClick={next}
            size="lg"
            className="w-full h-13 rounded-2xl text-base font-bold gap-2 shadow-lg shadow-primary/20 relative overflow-hidden group"
          >
            <motion.span
              className="absolute inset-0 bg-white/10"
              initial={{ x: "-100%" }}
              whileHover={{ x: "100%" }}
              transition={{ duration: 0.5 }}
            />
            {isLast ? (
              <>
                <Rocket className="w-5 h-5" />
                ابدأ رحلتك الآن
              </>
            ) : (
              <>
                التالي
                <ChevronLeft className="w-4 h-4" />
              </>
            )}
          </Button>

          <div className="flex items-center gap-2">
            {current > 0 && (
              <Button
                variant="outline"
                onClick={prev}
                className="flex-1 rounded-2xl h-11"
              >
                السابق
              </Button>
            )}
            {!isLast && (
              <Button
                variant="ghost"
                onClick={finish}
                className="flex-1 text-muted-foreground rounded-2xl h-11"
              >
                تخطي
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Onboarding;
