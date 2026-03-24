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

        {/* Grades Covered */}
        <div className="bg-card rounded-2xl border border-border p-6 md:p-8 mb-12 max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-bold text-lg text-foreground">الصفوف الدراسية المتاحة</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {grades.map((g) => (
              <div key={g} className="flex items-center gap-2 text-sm text-foreground">
                <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                <span>{g}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
            يتم تدريس المواد حسب المذهب الفقهي المقرر لكل مرحلة دراسية في الأزهر الشريف.
            الصفوف الإعدادية تدرس الفقه الشافعي، بينما الصفوف الثانوية تدرس المذاهب الثلاثة (الشافعي والمالكي والحنفي).
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

        {/* SEO-rich paragraph */}
        <div className="max-w-3xl mx-auto mt-12 text-center">
          <p className="text-muted-foreground text-sm leading-[2]">
            منصة الأستاذ إسماعيل أحمد عبادة هي الوجهة الأولى لطلاب الأزهر الشريف في مصر.
            نوفر شرحاً مبسطاً ووافياً لجميع مواد العلوم الشرعية بما يشمل: الفقه الإسلامي بمذاهبه المختلفة (الفقه الشافعي، الفقه المالكي، الفقه الحنفي)،
            وعلم التوحيد وأصول الدين، وتفسير القرآن الكريم، والحديث النبوي الشريف ومصطلحه، والسيرة النبوية الشريفة، والنحو العربي.
            المنصة مناسبة لطلاب المرحلة الإعدادية الأزهرية والمرحلة الثانوية الأزهرية،
            وتقدم فيديوهات تعليمية وامتحانات إلكترونية وواجبات تفاعلية ومسابقات أسبوعية وتقارير أداء لأولياء الأمور.
          </p>
        </div>
      </div>
    </section>
  );
};

export default SEOCurriculumSection;
