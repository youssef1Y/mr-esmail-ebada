import { Link } from "react-router-dom";
import { BookOpen, Newspaper, Users, Phone, Mail, MapPin, Heart, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

const footerLinks = [
  {
    title: "روابط سريعة",
    links: [
      { label: "الرئيسية", to: "/" },
      { label: "تسجيل الدخول", to: "/auth/login" },
      { label: "حساب جديد", to: "/auth/register" },
      { label: "أخبار المنصة", to: "/news" },
    ],
  },
  {
    title: "المنصة",
    links: [
      { label: "شروط الاستخدام", to: "/terms" },
      { label: "ولي الأمر", to: "/parent/login" },
      { label: "تواصل معنا", to: "/contact" },
      { label: "الجدول الدراسي", to: "/schedule" },
    ],
  },
];

const Footer = () => {
  return (
    <footer className="relative overflow-hidden">
      {/* Top decorative wave */}
      <div className="absolute top-0 left-0 right-0">
        <svg viewBox="0 0 1440 40" fill="none" className="w-full">
          <path d="M0 40L1440 40L1440 15C1440 15 1200 0 720 0C240 0 0 15 0 15L0 40Z" fill="hsl(var(--background))" />
        </svg>
      </div>

      <div className="bg-gradient-to-b from-primary/95 to-primary pt-16 pb-6">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 20px, hsl(var(--primary-foreground)) 20px, hsl(var(--primary-foreground)) 21px)`,
        }} />

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
            {/* Brand Column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gold/20 backdrop-blur-sm border border-gold/30 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <h3 className="font-bold text-primary-foreground text-sm">منصة الأستاذ إسماعيل</h3>
                  <p className="text-primary-foreground/50 text-xs">أحمد عباده</p>
                </div>
              </div>
              <p className="text-primary-foreground/60 text-xs leading-relaxed max-w-xs">
                منصة تعليمية متخصصة في العلوم الشرعية. دروس الفقه والحديث والتفسير والتوحيد لجميع المراحل الدراسية.
              </p>
              <div className="flex items-center gap-2 text-primary-foreground/50 text-xs">
                <MapPin className="w-3.5 h-3.5 text-gold/70" />
                <span>جمهورية مصر العربية</span>
              </div>
            </motion.div>

            {/* Links Columns */}
            {footerLinks.map((group, idx) => (
              <motion.div
                key={group.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * (idx + 1) }}
                className="space-y-4"
              >
                <h4 className="text-gold font-bold text-sm">{group.title}</h4>
                <ul className="space-y-2.5">
                  {group.links.map((link) => (
                    <li key={link.to}>
                      <Link
                        to={link.to}
                        className="text-primary-foreground/60 hover:text-gold text-xs transition-colors duration-200 flex items-center gap-1.5 group"
                      >
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-gold/70" />
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-primary-foreground/10 pt-5">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              <p className="text-primary-foreground/40 text-xs">
                © {new Date().getFullYear()} جميع الحقوق محفوظة — منصة الأستاذ إسماعيل أحمد عباده
              </p>
              <p className="text-primary-foreground/30 text-[10px] flex items-center gap-1">
                صُنع بـ <Heart className="w-3 h-3 text-destructive/70 fill-destructive/70" /> للعلوم الشرعية
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
