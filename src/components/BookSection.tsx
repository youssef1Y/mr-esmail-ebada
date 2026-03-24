import { motion } from "framer-motion";
import { Phone, MessageCircle, BookOpen, CheckCircle2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const bookImg = new URL("@/assets/book-cover.jpg", import.meta.url).href;

const bookFeatures = [
  "شرح مبسط وشامل لجميع الفروع",
  "تمارين تطبيقية وأسئلة متنوعة",
  "أمثلة عملية من المنهج الأزهري",
  "اختبارات تقييمية في نهاية كل باب",
  "مراجعة شاملة قبل الامتحانات",
];

const BookSection = () => {
  return (
    <section className="py-24 relative overflow-hidden bg-gradient-to-b from-card/50 to-background">
      {/* Decorative */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gold/5 rounded-full blur-[150px]" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-[120px]" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 bg-gold/10 text-gold text-sm font-bold px-5 py-2 rounded-full mb-4">
            <Star className="w-4 h-4 fill-gold" />
            الأكثر مبيعاً
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-amiri text-foreground mb-4">
            كتاب المرشد الأزهري
          </h2>
          <p className="text-muted-foreground leading-relaxed max-w-xl mx-auto text-base md:text-lg">
            كتاب شامل ومتكامل في العلوم الشرعية — مُعدّ ومُراجع بواسطة الأستاذ إسماعيل أحمد عبادة
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
          {/* Book Image */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative flex justify-center"
          >
            <div className="relative">
              {/* Glow behind book */}
              <div className="absolute inset-0 bg-gold/20 rounded-3xl blur-[60px] scale-75" />
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative"
              >
                <img
                  src={bookImg}
                  alt="كتاب المرشد الأزهري"
                  className="w-64 md:w-80 rounded-2xl shadow-2xl shadow-gold/20 border-2 border-gold/20"
                  loading="lazy"
                />
              </motion.div>
              {/* Badge */}
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, type: "spring" }}
                className="absolute -top-4 -right-4 bg-gold text-primary font-bold text-xs px-3 py-2 rounded-full shadow-lg"
              >
                إصدار جديد ✨
              </motion.div>
            </div>
          </motion.div>

          {/* Book Details */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-2xl md:text-3xl font-bold font-amiri text-foreground mb-3">
                سلسلة الأزهري في العلوم الشرعية
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                كتاب شامل يغطي جميع فروع العلوم الشرعية بطريقة مبسطة ومنظمة، مناسب لطلاب المراحل الإعدادية والثانوية الأزهرية. يتميز بالشرح الوافي والأمثلة التطبيقية والتمارين المتنوعة.
              </p>
            </div>

            <div className="space-y-3">
              {bookFeatures.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-foreground text-sm font-medium">{feature}</span>
                </motion.div>
              ))}
            </div>

            <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
              <p className="text-sm font-bold text-foreground">📞 للحجز والاستفسار:</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href="https://wa.me/201097602493" target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button className="w-full bg-[#25D366] hover:bg-[#1da851] text-white gap-2 h-11">
                    <MessageCircle className="w-4 h-4" />
                    واتساب
                  </Button>
                </a>
                <a href="tel:+201097602493" className="flex-1">
                  <Button variant="outline" className="w-full gap-2 h-11">
                    <Phone className="w-4 h-4" />
                    01097602493
                  </Button>
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default BookSection;
