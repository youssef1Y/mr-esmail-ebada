import { BookOpen, GraduationCap, Award, CheckCircle } from "lucide-react";
import { StaggerContainer, StaggerItem } from "./StaggerAnimation";

const grades = [
  "الصف الأول الإعدادي الأزهري",
  "الصف الثاني الإعدادي الأزهري",
  "الصف الثالث الإعدادي الأزهري",
  "الصف الأول الثانوي الأزهري",
  "الصف الثاني الثانوي الأزهري",
  "الصف الثالث الثانوي الأزهري",
];

const curriculumDetails = [
  {
    title: "الفقه بمذاهبه الثلاثة",
    description:
      "شرح وافٍ لمسائل الفقه الشافعي والمالكي والحنفي حسب المنهج الأزهري المقرر، مع بيان الأدلة من الكتاب والسنة، وذكر أقوال العلماء وترجيحاتهم. يتناول الشرح أبواب الطهارة والصلاة والصيام والزكاة والحج والمعاملات بأسلوب مبسط يناسب كل مرحلة دراسية.",
  },
  {
    title: "أصول الدين (التوحيد)",
    description:
      "دراسة العقيدة الإسلامية الصحيحة من كتاب المرشد الأزهري. يشمل الشرح: صفات الله تعالى، أركان الإيمان الستة، النبوات، السمعيات، والرد على الشبهات المعاصرة. مع التركيز على تثبيت العقيدة السليمة وفق منهج أهل السنة والجماعة.",
  },
  {
    title: "التفسير وعلوم القرآن",
    description:
      "تفسير سور وآيات القرآن الكريم المقررة في المنهج الأزهري مع بيان أسباب النزول ومعاني المفردات واستخراج الأحكام الشرعية والفوائد التربوية. يعتمد الشرح على أمهات كتب التفسير مثل تفسير الجلالين وتفسير ابن كثير.",
  },
  {
    title: "الحديث الشريف ومصطلحه",
    description:
      "شرح الأحاديث النبوية الشريفة المقررة في المنهج الأزهري مع بيان درجة الحديث وتخريجه واستنباط الأحكام والفوائد منه. يشمل الشرح دراسة علم مصطلح الحديث وأنواع الحديث الصحيح والحسن والضعيف وشروط قبول الحديث.",
  },
  {
    title: "السيرة النبوية",
    description:
      "دراسة شاملة لسيرة النبي محمد ﷺ من المولد الشريف والنشأة، مروراً بالبعثة والدعوة في مكة والهجرة إلى المدينة، وصولاً إلى الغزوات والفتوحات والوفاة. مع استخلاص الدروس والعبر التربوية من كل مرحلة من مراحل حياته ﷺ.",
  },
];

const SEOCurriculumSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="inline-block bg-primary/10 text-primary text-sm font-bold px-4 py-1.5 rounded-full mb-4">
            المنهج الدراسي الشامل
          </span>
          <h2 className="text-3xl md:text-4xl font-bold font-amiri text-foreground mb-4">
            منهج أزهري متكامل لجميع المراحل الدراسية
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            تقدم منصة الأستاذ إسماعيل أحمد عبادة منهجاً تعليمياً شاملاً يغطي جميع فروع العلوم الشرعية
            المقررة في الأزهر الشريف، من المرحلة الإعدادية حتى الثانوية الأزهرية.
            المحتوى مُعَدّ بعناية من كتاب المرشد الأزهري وسلسلة الأزهري في العلوم الشرعية.
          </p>
        </div>


        {/* Curriculum Details */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto" staggerDelay={0.08}>
          {curriculumDetails.map((item, index) => (
            <StaggerItem key={index}>
              <div className="bg-card rounded-2xl border border-border p-5 h-full hover:border-primary/20 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-4 h-4 text-primary shrink-0" />
                  <h3 className="font-bold text-sm text-foreground">{item.title}</h3>
                </div>
                <p className="text-muted-foreground text-xs leading-[1.8]">{item.description}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

      </div>
    </section>
  );
};

export default SEOCurriculumSection;
