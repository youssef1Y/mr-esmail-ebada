import { Link } from "react-router-dom";
import { BookOpen, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="text-sm font-bold leading-tight">
            <div>الأستاذ إسماعيل</div>
            <div className="text-muted-foreground text-xs">أحمد عباده</div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">الرئيسية</Link>
          <a href="/#about" className="text-sm font-medium hover:text-primary transition-colors">من نحن</a>
          <a href="/#join" className="text-sm font-medium hover:text-primary transition-colors">انضم إلينا</a>
        </div>

        {/* Auth Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link to="/auth/login">
            <Button variant="outline" size="sm">تسجيل الدخول</Button>
          </Link>
          <Link to="/auth/register">
            <Button size="sm">حساب جديد</Button>
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-card border-b border-border px-4 pb-4 space-y-3">
          <Link to="/" className="block text-sm py-2" onClick={() => setMenuOpen(false)}>الرئيسية</Link>
          <a href="/#about" className="block text-sm py-2" onClick={() => setMenuOpen(false)}>من نحن</a>
          <a href="/#join" className="block text-sm py-2" onClick={() => setMenuOpen(false)}>انضم إلينا</a>
          <div className="flex gap-2 pt-2">
            <Link to="/auth/login" className="flex-1" onClick={() => setMenuOpen(false)}>
              <Button variant="outline" size="sm" className="w-full">تسجيل الدخول</Button>
            </Link>
            <Link to="/auth/register" className="flex-1" onClick={() => setMenuOpen(false)}>
              <Button size="sm" className="w-full">حساب جديد</Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
