import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section id="join" className="py-20 hero-gradient text-primary-foreground relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/2 left-1/4 w-72 h-72 bg-gold rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-56 h-56 bg-primary-foreground rounded-full blur-3xl" />
      </div>
      <div className="container mx-auto px-4 text-center relative z-10">
        <h2 className="text-3xl md:text-4xl font-bold font-amiri mb-4">سارع بالانضمام إلينا</h2>
        <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8 leading-relaxed">
          انضم الآن إلى منصة الأستاذ إسماعيل أحمد عباده واحصل على شرح مميز في أصول الدين والفقه. سجل حسابك واختر صفك الدراسي وابدأ رحلة التعلم.
        </p>
        <Link to="/auth/register">
          <Button size="lg" className="bg-gold hover:bg-gold-light text-primary font-bold px-10 shadow-lg hover:shadow-xl transition-shadow duration-300">
            سجل الآن مجانًا
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default CTASection;
