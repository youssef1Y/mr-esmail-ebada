import { Video, FileText, ClipboardList, Trophy, Brain, Users } from "lucide-react";

const steps = [
  {
    icon: Video,
    title: "شاهد الدرس",
    description: "فيديوهات شرح مفصلة ومبسطة لكل درس في المنهج الأزهري. الشرح يعتمد على كتاب المرشد الأزهري مع أمثلة عملية وتطبيقات.",
  },
  {
    icon: Brain,
    title: "تدرّب وراجع",
    description: "بنك أسئلة تفاعلي يضم مئات الأسئلة المتنوعة لكل مادة ودرس. تدرّب على الأسئلة الاختيارية واعرف نتيجتك فوراً مع تفسير الإجابات الصحيحة.",
  },
  {
    icon: ClipboardList,
    title: "حلّ الواجبات",
    description: "واجبات منزلية دورية لتثبيت المعلومات. ارفع إجاباتك واحصل على التقييم والملاحظات من الأستاذ إسماعيل أحمد عبادة شخصياً.",
  },
  {
    icon: FileText,
    title: "اختبر نفسك",
    description: "امتحانات إلكترونية شاملة تحاكي امتحانات الأزهر الشريف الفعلية. تصحيح فوري مع عرض الإجابات الصحيحة وتحليل مفصل لأدائك.",
  },
  {
    icon: Trophy,
    title: "تنافس واربح",
    description: "مسابقات أسبوعية مع جوائز وشهادات تقدير. اجمع النقاط من الواجبات والامتحانات وتصدّر لوحة المتصدرين بين زملائك في نفس الصف.",
  },
  {
    icon: Users,
    title: "تقارير لولي الأمر",
    description: "تقارير أداء أسبوعية تُرسل تلقائياً لولي الأمر عبر الواتساب. تتضمن نتائج الامتحانات والواجبات ومعدل حضور الفيديوهات ومستوى التقدم.",
  },
];

const SEOMethodSection = () => {
  return (
    <section className="py-20 bg-card/50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="inline-block bg-gold/10 text-gold text-sm font-bold px-4 py-1.5 rounded-full mb-4">
            طريقة التعلم
          </span>
          <h2 className="text-3xl md:text-4xl font-bold font-amiri text-foreground mb-4">
            كيف تتعلم على منصة الأستاذ إسماعيل أحمد عبادة؟
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            اتبع هذه الخطوات البسيطة لتحقيق أفضل النتائج في العلوم الشرعية والمواد الأزهرية
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative bg-card rounded-2xl border border-border p-5 hover:border-primary/20 transition-colors"
            >
              {/* Step number */}
              <div className="absolute -top-3 -right-2 w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                {index + 1}
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <step.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-bold text-sm mb-2 text-foreground">{step.title}</h3>
              <p className="text-muted-foreground text-xs leading-[1.8]">{step.description}</p>
            </div>
          ))}
        </div>

        {/* SEO paragraph */}
        <div className="max-w-3xl mx-auto mt-12">
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-bold text-base mb-3 text-foreground text-center">لماذا منصة الأستاذ إسماعيل أحمد عبادة؟</h3>
            <p className="text-muted-foreground text-sm leading-[2] text-center">
              الأستاذ إسماعيل أحمد عبادة هو مُعِدّ ومُراجع كتاب المرشد الأزهري وصاحب سلسلة الأزهري في العلوم الشرعية.
              يتميز بأسلوب شرح مبسط وسهل يوصل المعلومة لجميع الطلاب بمختلف مستوياتهم.
              المنصة تعتمد على أحدث التقنيات التعليمية مثل الذكاء الاصطناعي في توليد الأسئلة وتحليل أداء الطلاب،
              مع نظام متابعة متكامل يربط بين الطالب والمعلم وولي الأمر.
              سواء كنت طالباً في المرحلة الإعدادية الأزهرية أو الثانوية الأزهرية،
              ستجد على المنصة كل ما تحتاجه للتفوق في مواد الفقه والتوحيد والتفسير والحديث والسيرة النبوية.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SEOMethodSection;
