import { Link } from "react-router-dom";
import { BookOpen, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
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
        <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen 
            ? <X className={`w-6 h-6 ${scrolled ? "text-foreground" : "text-primary-foreground"}`} /> 
            : <Menu className={`w-6 h-6 ${scrolled ? "text-foreground" : "text-primary-foreground"}`} />
          }
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-card/95 backdrop-blur-lg border-b border-border px-4 pb-4 space-y-3">
          <Link to="/" className="block text-sm py-2 text-foreground" onClick={() => setMenuOpen(false)}>الرئيسية</Link>
          <a href="/#about" className="block text-sm py-2 text-foreground" onClick={() => setMenuOpen(false)}>من نحن</a>
          <a href="/#join" className="block text-sm py-2 text-foreground" onClick={() => setMenuOpen(false)}>انضم إلينا</a>
          <div className="flex gap-2 pt-2">
            <Link to="/auth/login" className="flex-1" onClick={() => setMenuOpen(false)}>
              <Button variant="outline" size="sm" className="w-full">تسجيل الدخول</Button>
            </Link>
            <Link to="/auth/register" className="flex-1" onClick={() => setMenuOpen(false)}>
              <Button size="sm" className="w-full bg-gold hover:bg-gold-light text-primary font-bold">حساب جديد</Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
