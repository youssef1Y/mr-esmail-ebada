import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Video, Trophy, ClipboardList, ChevronLeft, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const steps = [
  {
    icon: Sparkles,
    title: "مرحباً بك في المنصة!",
    description: "منصة الأستاذ إسماعيل أحمد عباده لتعليم العلوم الشرعية. دعنا نعرّفك على أهم المميزات.",
    bg: "from-primary to-primary/70",
  },
  {
    icon: Video,
    title: "فيديوهات تعليمية",
    description: "شاهد شروحات مفصلة لجميع المواد الدراسية في أي وقت ومن أي مكان بجودة عالية.",
    bg: "from-accent to-accent/70",
  },
  {
    icon: ClipboardList,
    title: "امتحانات وواجبات",
    description: "حل الامتحانات الإلكترونية والواجبات وتلقّ التقييم الفوري لمعرفة مستواك وتحسين أدائك.",
    bg: "from-primary to-primary/70",
  },
  {
    icon: Trophy,
    title: "نقاط ومنافسة",
    description: "اجمع النقاط عند حل الامتحانات والواجبات ونافس زملاءك في لوحة المتصدرين!",
    bg: "from-accent to-accent/70",
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

  if (!checked) return <div className="min-h-screen bg-background" />;

  const step = steps[current];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 6, repeat: Infinity }}
        className="absolute top-[-20%] right-[-15%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl"
      />
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute bottom-[-20%] left-[-15%] w-[400px] h-[400px] rounded-full bg-accent/5 blur-3xl"
      />

      <div className="w-full max-w-md relative z-10">
        {/* Progress dots */}
        <div className="flex justify-center gap-2.5 mb-12">
          {steps.map((_, i) => (
            <motion.div
              key={i}
              animate={{ width: i === current ? 32 : 8 }}
              className={`h-2 rounded-full transition-colors ${i === current ? "bg-primary" : i < current ? "bg-primary/40" : "bg-muted"}`}
            />
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -50, scale: 0.95 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-center"
          >
            {/* Icon with animated rings */}
            <div className="relative flex items-center justify-center mb-10">
              {[0, 1].map(i => (
                <motion.div
                  key={i}
                  className="absolute rounded-3xl border border-primary/20"
                  style={{ width: 120 + i * 30, height: 120 + i * 30 }}
                  animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.1, 0.3] }}
                  transition={{ duration: 3, delay: i * 0.5, repeat: Infinity }}
                />
              ))}
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 150 }}
                className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${step.bg} flex items-center justify-center shadow-xl shadow-primary/20`}
              >
                <step.icon className="w-12 h-12 text-primary-foreground" />
              </motion.div>
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold font-amiri mb-3"
            >
              {step.title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-muted-foreground leading-relaxed max-w-sm mx-auto"
            >
              {step.description}
            </motion.p>

            {/* Decorative stars */}
            {current === 0 && (
              <div className="flex justify-center gap-1 mt-4">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                  >
                    <Star className="w-4 h-4 text-accent fill-accent" />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-14 flex flex-col gap-3"
        >
          <Button
            onClick={next}
            size="lg"
            className="w-full h-12 rounded-xl text-base font-bold gap-2 shadow-lg shadow-primary/20"
          >
            {current < steps.length - 1 ? "التالي" : (
              <>
                <Sparkles className="w-4 h-4" />
                ابدأ الآن
              </>
            )}
            {current < steps.length - 1 && <ChevronLeft className="w-4 h-4" />}
          </Button>
          {current < steps.length - 1 && (
            <Button variant="ghost" onClick={finish} className="text-muted-foreground">
              تخطي
            </Button>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Onboarding;
