import { Link } from "react-router-dom";
import { BookOpen, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm">شروط وأحكام الاستخدام</span>
          </div>
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-1">
              العودة <ChevronRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold font-amiri text-center mb-8">شروط وأحكام استخدام المنصة</h1>

        <div className="bg-card rounded-2xl border border-border p-6 space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="font-bold text-base mb-2 text-primary">1. مقدمة</h2>
            <p className="text-muted-foreground">
              مرحبًا بك في منصة الأستاذ إسماعيل أحمد عبادة للعلوم الشرعية. باستخدامك لهذه المنصة فإنك توافق على الالتزام بهذه الشروط والأحكام. يُرجى قراءتها بعناية قبل التسجيل أو استخدام أي من خدمات المنصة.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2 text-primary">2. التسجيل والحساب</h2>
            <ul className="text-muted-foreground space-y-1 list-disc list-inside">
              <li>يجب أن تكون البيانات المُدخلة عند التسجيل صحيحة ودقيقة.</li>
              <li>أنت مسؤول عن الحفاظ على سرية بيانات حسابك وكلمة المرور.</li>
              <li>يحق للإدارة حذف أو تعليق أي حساب يخالف شروط الاستخدام.</li>
              <li>يجب أن يكون عمر المستخدم مناسبًا للمرحلة الدراسية المسجل بها.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2 text-primary">3. الاشتراك والدفع</h2>
            <ul className="text-muted-foreground space-y-1 list-disc list-inside">
              <li>الاشتراك الشهري يتيح الوصول لجميع المحتوى التعليمي للصف المسجل به.</li>
              <li>يتم تفعيل الاشتراك بعد التحقق من إيصال التحويل من قبل الإدارة.</li>
              <li>الاشتراك صالح لمدة 30 يومًا من تاريخ التفعيل ولا يتم تجديده تلقائيًا.</li>
              <li>المبالغ المدفوعة غير قابلة للاسترداد بعد تفعيل الاشتراك.</li>
              <li>أسعار الاشتراك: المرحلة الإعدادية 150 جنيه - المرحلة الثانوية 200 جنيه شهريًا.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2 text-primary">4. المحتوى التعليمي</h2>
            <ul className="text-muted-foreground space-y-1 list-disc list-inside">
              <li>جميع الفيديوهات والمحتوى التعليمي محفوظة الحقوق للمنصة.</li>
              <li>يُحظر تحميل أو نسخ أو إعادة نشر أي محتوى من المنصة بدون إذن مسبق.</li>
              <li>يُحظر مشاركة حسابك أو بيانات الدخول مع أي شخص آخر.</li>
              <li>يحق للإدارة تعديل أو حذف أي محتوى في أي وقت.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2 text-primary">5. الامتحانات والواجبات</h2>
            <ul className="text-muted-foreground space-y-1 list-disc list-inside">
              <li>يجب على الطالب حل الامتحانات والواجبات بنفسه دون مساعدة خارجية.</li>
              <li>درجة الواجب من 10 درجات.</li>
              <li>أي محاولة للغش أو التلاعب بالنتائج تعرض الحساب للإيقاف.</li>
              <li>النقاط المكتسبة تُحسب تلقائيًا ولا يمكن تعديلها من قبل الطالب.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2 text-primary">6. السلوك والأدب</h2>
            <ul className="text-muted-foreground space-y-1 list-disc list-inside">
              <li>يجب الالتزام بالأدب والاحترام في جميع التعليقات والرسائل.</li>
              <li>يُحظر نشر محتوى مسيء أو مخالف للآداب العامة والشريعة الإسلامية.</li>
              <li>يحق للإدارة حذف أي تعليق أو رسالة مخالفة دون إشعار مسبق.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2 text-primary">7. الخصوصية</h2>
            <ul className="text-muted-foreground space-y-1 list-disc list-inside">
              <li>نحتفظ ببيانات الطلاب لأغراض تعليمية فقط ولا نشاركها مع أي جهة خارجية.</li>
              <li>يتم إرسال تقارير أداء أسبوعية لأولياء الأمور عبر الواتساب.</li>
              <li>يحق للطالب طلب حذف حسابه وبياناته من المنصة.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-base mb-2 text-primary">8. التعديلات</h2>
            <p className="text-muted-foreground">
              تحتفظ إدارة المنصة بحق تعديل هذه الشروط والأحكام في أي وقت. سيتم إشعار المستخدمين بأي تغييرات جوهرية. استمرارك في استخدام المنصة بعد التعديل يعني موافقتك على الشروط المُعدّلة.
            </p>
          </section>

          <section className="bg-primary/5 rounded-xl p-4">
            <p className="text-center text-muted-foreground">
              باستخدامك لمنصة الأستاذ إسماعيل أحمد عبادة فإنك توافق على جميع الشروط والأحكام المذكورة أعلاه.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Terms;
