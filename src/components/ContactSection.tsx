import { motion } from "framer-motion";
import { Phone, MessageCircle, Headphones, Clock, MapPin, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const contactMethods = [
  {
    icon: MessageCircle,
    title: "واتساب",
    subtitle: "تواصل فوري",
    value: "01097602493",
    href: "https://wa.me/201097602493",
    color: "bg-[#25D366]/10 text-[#25D366]",
    btnColor: "bg-[#25D366] hover:bg-[#1da851] text-white",
    btnText: "ابدأ المحادثة",
  },
  {
    icon: Phone,
    title: "اتصال مباشر",
    subtitle: "خط الدعم",
    value: "01097602493",
    href: "tel:+201097602493",
    color: "bg-primary/10 text-primary",
    btnColor: "bg-primary hover:bg-primary/90 text-primary-foreground",
    btnText: "اتصل الآن",
  },
];

const ContactSection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[200px]" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-bold px-5 py-2 rounded-full mb-4">
            <Headphones className="w-4 h-4" />
            تواصل معنا
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-amiri text-foreground mb-4">
            نحن هنا لمساعدتك
          </h2>
          <p className="text-muted-foreground leading-relaxed max-w-lg mx-auto text-base md:text-lg">
            فريق الدعم متاح للرد على جميع استفساراتك ومساعدتك في رحلتك التعليمية
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-12">
          {contactMethods.map((method, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="bg-card rounded-2xl border border-border p-6 text-center space-y-4 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5"
            >
              <div className={`w-16 h-16 rounded-2xl ${method.color} flex items-center justify-center mx-auto`}>
                <method.icon className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-1">{method.title}</h3>
                <p className="text-muted-foreground text-sm">{method.subtitle}</p>
              </div>
              <p className="text-lg font-bold text-foreground direction-ltr" dir="ltr">{method.value}</p>
              <a href={method.href} target="_blank" rel="noopener noreferrer">
                <Button className={`w-full ${method.btnColor} h-11 font-bold`}>
                  <method.icon className="w-4 h-4 ml-2" />
                  {method.btnText}
                </Button>
              </a>
            </motion.div>
          ))}
        </div>

        {/* Info bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground"
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span>متاحون يومياً</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span>جمهورية مصر العربية</span>
          </div>
          <div className="flex items-center gap-2">
            <Headphones className="w-4 h-4 text-primary" />
            <span>رد سريع خلال دقائق</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ContactSection;
