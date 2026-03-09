import { Link } from "react-router-dom";
import { BookOpen, Menu, X, Home, LogIn, UserPlus, Info, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";

const mobileLinks = [
  { label: "الرئيسية", href: "/", icon: Home, isRoute: true },
  { label: "من نحن", href: "/#about", icon: Info, isRoute: false },
  { label: "انضم إلينا", href: "/#join", icon: Users, isRoute: false },
];

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-card/90 backdrop-blur-lg shadow-sm border-b border-border" : "bg-transparent"}`}>
        <div className="container mx-auto px-4 flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${scrolled ? "bg-primary" : "bg-primary-foreground/15 backdrop-blur-sm border border-primary-foreground/20"}`}>
              <BookOpen className={`w-5 h-5 ${scrolled ? "text-primary-foreground" : "text-gold"}`} />
            </div>
            <div className={`text-sm font-bold leading-tight transition-colors ${scrolled ? "text-foreground" : "text-primary-foreground"}`}>
              <div>الأستاذ إسماعيل</div>
              <div className={`text-xs ${scrolled ? "text-muted-foreground" : "text-primary-foreground/60"}`}>أحمد عباده</div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {[
              { label: "الرئيسية", href: "/" },
              { label: "من نحن", href: "/#about" },
              { label: "انضم إلينا", href: "/#join" },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={`text-sm font-medium transition-colors ${scrolled ? "text-foreground hover:text-primary" : "text-primary-foreground/80 hover:text-gold"}`}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle className={!scrolled ? "text-primary-foreground hover:bg-primary-foreground/10" : ""} />
            <Link to="/auth/login">
              <Button variant={scrolled ? "outline" : "ghost"} size="sm" className={!scrolled ? "text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/10" : ""}>
                تسجيل الدخول
              </Button>
            </Link>
            <Link to="/auth/register">
              <Button size="sm" className="bg-gold hover:bg-gold-light text-primary font-bold">
                حساب جديد
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden relative z-[60]" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen 
              ? <X className="w-6 h-6 text-primary-foreground" /> 
              : <Menu className={`w-6 h-6 ${scrolled ? "text-foreground" : "text-primary-foreground"}`} />
            }
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Overlay + Panel */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[55] bg-black/50 backdrop-blur-sm"
              onClick={() => setMenuOpen(false)}
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed top-0 right-0 z-[56] h-full w-[280px] bg-gradient-to-b from-primary to-primary/95 shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center gap-3 p-6 pb-4 border-b border-primary-foreground/10">
                <div className="w-10 h-10 rounded-xl bg-gold/20 border border-gold/30 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <div className="text-primary-foreground font-bold text-sm">الأستاذ إسماعيل</div>
                  <div className="text-primary-foreground/50 text-xs">أحمد عباده</div>
                </div>
              </div>

              {/* Links */}
              <div className="flex-1 py-4 px-3 space-y-1">
                {mobileLinks.map((link, i) => {
                  const Icon = link.icon;
                  const content = (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-gold transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Icon className="w-4.5 h-4.5" />
                      <span className="text-sm font-medium">{link.label}</span>
                    </motion.div>
                  );

                  return link.isRoute ? (
                    <Link key={link.label} to={link.href}>{content}</Link>
                  ) : (
                    <a key={link.label} href={link.href}>{content}</a>
                  );
                })}
              </div>

              {/* Bottom Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="p-5 border-t border-primary-foreground/10 space-y-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-primary-foreground/50 text-xs">تغيير المظهر</span>
                  <ThemeToggle className="text-primary-foreground hover:bg-primary-foreground/10" />
                </div>
                <Link to="/auth/login" onClick={() => setMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 mb-2">
                    <LogIn className="w-4 h-4 ml-2" />
                    تسجيل الدخول
                  </Button>
                </Link>
                <Link to="/auth/register" onClick={() => setMenuOpen(false)}>
                  <Button size="sm" className="w-full bg-gold hover:bg-gold-light text-primary font-bold">
                    <UserPlus className="w-4 h-4 ml-2" />
                    حساب جديد
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
