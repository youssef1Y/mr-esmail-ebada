import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Video, Trophy, ClipboardList, ChevronLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  {
    icon: Sparkles,
    title: "مرحباً بك في المنصة!",
    description: "منصة الأستاذ إسماعيل أحمد عباده لتعليم العلوم الشرعية. دعنا نعرّفك على أهم المميزات.",
    color: "primary",
  },
  {
    icon: Video,
    title: "فيديوهات تعليمية",
    description: "شاهد شروحات مفصلة لجميع المواد الدراسية في أي وقت ومن أي مكان بجودة عالية.",
    color: "accent",
  },
  {
    icon: ClipboardList,
    title: "امتحانات وواجبات",
    description: "حل الامتحانات الإلكترونية والواجبات وتلقّ التقييم الفوري لمعرفة مستواك وتحسين أدائك.",
    color: "primary",
  },
  {
    icon: Trophy,
    title: "نقاط ومنافسة",
    description: "اجمع النقاط عند حل الامتحانات والواجبات ونافس زملاءك في لوحة المتصدرين!",
    color: "accent",
  },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);

  const next = () => {
    if (current < steps.length - 1) setCurrent(c => c + 1);
    else navigate("/dashboard", { replace: true });
  };

  const skip = () => navigate("/dashboard", { replace: true });

  const step = steps[current];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-20%] right-[-15%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-[-20%] left-[-15%] w-[400px] h-[400px] rounded-full bg-accent/5 blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-10">
          {steps.map((_, i) => (
            <motion.div
              key={i}
              className={`h-2 rounded-full transition-all ${i === current ? "bg-primary w-8" : i < current ? "bg-primary/40 w-2" : "bg-muted w-2"}`}
              layout
            />
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
              className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl ${
                step.color === "accent"
                  ? "bg-gradient-to-br from-accent to-accent/70 shadow-accent/20"
                  : "bg-gradient-to-br from-primary to-primary/70 shadow-primary/20"
              }`}
            >
              <step.icon className="w-12 h-12 text-primary-foreground" />
            </motion.div>

            <h1 className="text-2xl font-bold font-amiri mb-3">{step.title}</h1>
            <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto">{step.description}</p>
          </motion.div>
        </AnimatePresence>

        {/* Actions */}
        <div className="mt-12 flex flex-col gap-3">
          <Button
            onClick={next}
            size="lg"
            className="w-full h-12 rounded-xl text-base font-bold gap-2 shadow-lg shadow-primary/20"
          >
            {current < steps.length - 1 ? "التالي" : "ابدأ الآن"}
            <ChevronLeft className="w-4 h-4" />
          </Button>
          {current < steps.length - 1 && (
            <Button variant="ghost" onClick={skip} className="text-muted-foreground">
              تخطي
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
