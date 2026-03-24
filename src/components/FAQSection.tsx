import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    question: "ما هي المراحل الدراسية المتاحة على المنصة؟",
    answer: "المنصة تغطي جميع المراحل الأزهرية من الصف الأول الإعدادي حتى الصف الثالث الثانوي، مع مراعاة اختلاف المذاهب الفقهية لكل مرحلة.",
  },
  {
    question: "كيف يمكنني الاشتراك في المنصة؟",
    answer: "يمكنك التسجيل مجاناً والوصول للمحتوى المجاني. للاشتراك الكامل، قم بتحويل رسوم الاشتراك عبر فودافون كاش ثم أرسل طلب الاشتراك من داخل المنصة وسيتم تفعيله خلال 24 ساعة.",
  },
  {
    question: "هل يمكنني مشاهدة الفيديوهات بدون اشتراك؟",
    answer: "نعم، هناك فيديوهات مجانية متاحة لجميع الطلاب. الاشتراك يتيح لك الوصول لجميع الفيديوهات والامتحانات والواجبات والميزات الحصرية.",
  },
  {
    question: "كيف يتم تصحيح الامتحانات والواجبات؟",
    answer: "الأسئلة الاختيارية يتم تصحيحها تلقائياً فور التسليم. أما الأسئلة المقالية والواجبات فيتم تصحيحها يدوياً من قبل الأستاذ إسماعيل مع إضافة ملاحظات وتوجيهات للطالب.",
  },
  {
    question: "ما هو نظام النقاط والشهادات؟",
    answer: "يحصل الطالب على نقاط عند تسليم الواجبات وإتمام الامتحانات. عند الحصول على الدرجة الكاملة (10/10) في الواجب أو الدرجة النهائية في الامتحان، يحصل الطالب على شهادة تفوق قابلة للطباعة.",
  },
  {
    question: "هل يتم إرسال تقارير أداء لأولياء الأمور؟",
    answer: "نعم، يتم إرسال تقارير أداء أسبوعية تلقائية لأولياء الأمور عبر الواتساب تتضمن نتائج الامتحانات والواجبات ومعدل المشاهدة.",
  },
  {
    question: "ما هي المواد التي يتم تدريسها على منصة الأستاذ إسماعيل أحمد عبادة؟",
    answer: "يتم تدريس الفقه الإسلامي بمذاهبه الثلاثة (الشافعي والمالكي والحنفي)، والتوحيد وأصول الدين، وتفسير القرآن الكريم، والحديث النبوي الشريف، والسيرة النبوية، والنحو والصرف. جميع المواد مطابقة للمنهج الأزهري المقرر.",
  },
  {
    question: "ما هو بنك الأسئلة التفاعلي؟",
    answer: "بنك الأسئلة هو نظام تدريب ذاتي يضم مئات الأسئلة لكل مادة ودرس. يمكن للطالب اختيار المادة والدرس وعدد الأسئلة (10 أو 15 أو 20) والتدرب عليها مع معرفة الإجابة الصحيحة فوراً. الأسئلة تُستخرج من المنهج الدراسي ومن الفيديوهات التعليمية بالذكاء الاصطناعي.",
  },
  {
    question: "كيف أتواصل مع الأستاذ إسماعيل أحمد عبادة؟",
    answer: "يمكنك التواصل مباشرة عبر واتساب على الرقم 01097602493 أو من خلال صفحة التواصل داخل المنصة. كما يمكنك إرسال رسالة مباشرة من لوحة التحكم الخاصة بك.",
  },
  {
    question: "هل المنصة متاحة على الموبايل؟",
    answer: "نعم، المنصة تعمل على جميع الأجهزة (موبايل، تابلت، كمبيوتر) وتدعم التثبيت كتطبيق PWA على هاتفك للوصول السريع بدون تحميل من متجر التطبيقات.",
  },
  {
    question: "ما هي المسابقات الأسبوعية؟",
    answer: "المسابقات الأسبوعية هي مسابقات تفاعلية يشارك فيها الطلاب بالإجابة على أسئلة من المنهج الدراسي يومياً. في نهاية الأسبوع يتم السحب بين المشاركين الذين أجابوا إجابات صحيحة للفوز بجوائز وشهادات تقدير.",
  },
];

const FAQSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <span className="inline-block bg-primary/10 text-primary text-sm font-bold px-4 py-1.5 rounded-full mb-4">
            أسئلة شائعة
          </span>
          <h2 className="text-3xl md:text-4xl font-bold font-amiri text-foreground mb-4">
            الأسئلة الأكثر شيوعاً
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            إجابات على أهم الأسئلة التي يطرحها الطلاب وأولياء الأمور عن المنصة
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-2xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card rounded-xl border border-border px-5 data-[state=open]:border-primary/30 transition-colors"
              >
                <AccordionTrigger className="text-sm font-bold text-right hover:no-underline py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
