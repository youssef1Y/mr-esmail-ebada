import { Link } from "react-router-dom";
import { BookOpen, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import islamicPattern from "@/assets/islamic-pattern.jpg";
import teacherImg from "@/assets/teacher.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={islamicPattern} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 hero-gradient opacity-85" />
      </div>

      <div className="container mx-auto px-4 relative z-10 pt-20">
        <div className="flex flex-col items-center gap-6 md:gap-8">
          {/* Content */}
          <div className="text-center space-y-4 md:space-y-6">
            <div className="inline-flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 rounded-full px-4 py-2 text-primary-foreground text-sm">
              <BookOpen className="w-4 h-4" />
              <span>منصة تعليمية متخصصة</span>
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-gold leading-tight" style={{ fontFamily: "'Aref Ruqaa', serif" }}>
              مِنَصَّةُ الْأُسْتَاذِ إِسْمَاعِيل أَحْمَد عِبَادَة
            </h1>

            <p className="text-primary-foreground/80 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
              مُعِدُّ ومُراجعُ كتاب المرشد الأزهري | صاحبُ سلسلةِ الأزهريّ في العلومِ الشرعيةِ
            </p>
          </div>

          {/* Teacher Image - Below the name */}
          <div className="w-48 h-48 md:w-64 md:h-64 rounded-full border-4 border-gold/50 overflow-hidden flex-shrink-0 shadow-2xl">
            <img src={teacherImg} alt="الأستاذ إسماعيل أحمد عباده" className="w-full h-full object-cover" />
          </div>

          <div className="text-center space-y-4">
            <p className="text-primary-foreground/70 text-xs md:text-sm max-w-lg mx-auto leading-relaxed">
              المِنَصَّةُ مُتَخَصِّصَةٌ فِي: تَعْلِيمِ الفِقْهِ الشّافِعِيِّ، وَ المَالِكِيِّ، وَ الْحَنَفِيِّ، وَ أُصُولِ الدِّينِ (التَّوْحِيدِ– التَّفْسِيرِ– الْحَدِيثِ– السِّيرَةِ).
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/auth/register">
                <Button size="lg" className="bg-gold hover:bg-gold-light text-primary font-bold px-8">
                  سجل الآن مجانًا
                </Button>
              </Link>
              <a href="#about">
                <Button size="lg" variant="outline" className="border-gold text-gold hover:bg-gold hover:text-primary font-bold">
                  تعرف علينا
                </Button>
              </a>
            </div>

            <div className="flex items-center gap-6 justify-center text-primary-foreground/70 text-sm pt-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                <span>مناهج معتمدة</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>+500 طالب</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
