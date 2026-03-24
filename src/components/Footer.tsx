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
              <div className="flex items-center gap-3 pt-2">
                <a
                  href="https://wa.me/201097602493"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/30 text-[#25D366] rounded-full px-4 py-2 text-xs font-bold transition-colors"
                >
                  <svg viewBox="0 0 32 32" className="w-4 h-4 fill-current">
                    <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.128 6.744 3.046 9.378L1.054 31.29l6.118-1.958A15.9 15.9 0 0016.004 32C24.826 32 32 24.822 32 16S24.826 0 16.004 0zm9.31 22.594c-.39 1.1-1.932 2.014-3.168 2.28-.846.18-1.95.324-5.67-1.218-4.762-1.972-7.828-6.81-8.066-7.126-.228-.316-1.916-2.55-1.916-4.862 0-2.312 1.212-3.45 1.642-3.924.39-.428 1.03-.642 1.644-.642.198 0 .376.01.536.018.472.02.708.048 1.02.79.39.926 1.338 3.266 1.456 3.504.12.238.238.554.078.87-.15.326-.278.528-.516.81-.238.282-.488.502-.726.81-.218.268-.464.554-.192 1.026.272.462 1.212 2 2.602 3.238 1.786 1.59 3.292 2.084 3.762 2.312.368.178.808.148 1.092-.148.358-.376.802-.998 1.252-1.612.32-.438.724-.494 1.122-.336.406.148 2.568 1.21 3.008 1.43.44.218.732.33.84.51.108.18.108 1.048-.282 2.148z"/>
                  </svg>
                  تواصل واتساب
                </a>
                <a
                  href="tel:+201097602493"
                  className="inline-flex items-center gap-2 bg-primary-foreground/10 hover:bg-primary-foreground/20 border border-primary-foreground/20 text-primary-foreground/70 rounded-full px-4 py-2 text-xs font-bold transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  اتصل بنا
                </a>
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
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
