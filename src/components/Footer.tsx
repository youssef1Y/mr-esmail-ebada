import { BookOpen } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border py-8">
      <div className="container mx-auto px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-sm">منصة الأستاذ إسماعيل أحمد عباده</span>
        </div>
        <p className="text-muted-foreground text-xs">
          © {new Date().getFullYear()} جميع الحقوق محفوظة
        </p>
      </div>
    </footer>
  );
};

export default Footer;
