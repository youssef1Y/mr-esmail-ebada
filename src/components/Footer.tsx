import { Link } from "react-router-dom";
import { BookOpen, Newspaper, Users } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm">منصة الأستاذ إسماعيل أحمد عباده</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">شروط وأحكام الاستخدام</Link>
            <span className="text-border">|</span>
            <Link to="/news" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              <Newspaper className="w-3 h-3" />
              أخبار المنصة
            </Link>
            <span className="text-border">|</span>
            <Link to="/parent/login" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              <Users className="w-3 h-3" />
              ولي الأمر
            </Link>
          </div>
          <p className="text-muted-foreground text-xs">
            © {new Date().getFullYear()} جميع الحقوق محفوظة
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
