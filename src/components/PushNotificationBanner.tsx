import { useState, useEffect } from "react";
import { Bell, BellOff, X, Settings, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const NotificationBlockedDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) => {
  const isAndroid = /android/i.test(navigator.userAgent);
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isChrome = /chrome/i.test(navigator.userAgent) && !/edg/i.test(navigator.userAgent);
  const isFirefox = /firefox/i.test(navigator.userAgent);
  const isSafari = /safari/i.test(navigator.userAgent) && !isChrome;

  const getSteps = () => {
    if (isIOS && isSafari) {
      return [
        "افتح الإعدادات (Settings) على جهازك",
        "انتقل إلى Safari → مواقع الويب → الإشعارات",
        "ابحث عن هذا الموقع واسمح بالإشعارات",
        "ارجع للمنصة واضغط تفعيل مرة تانية",
      ];
    }
    if (isAndroid && isChrome) {
      return [
        "اضغط على 🔒 القفل بجانب عنوان الموقع في الأعلى",
        "اضغط على \"الأذونات\" أو \"إعدادات الموقع\"",
        "فعّل \"الإشعارات\" واختر \"سماح\"",
        "ارجع للمنصة واضغط تفعيل مرة تانية",
      ];
    }
    if (isChrome) {
      return [
        "اضغط على 🔒 القفل بجانب عنوان الموقع في شريط العنوان",
        "اضغط \"إعدادات الموقع\" (Site settings)",
        "غيّر \"الإشعارات\" من \"حظر\" إلى \"سماح\"",
        "ارجع للمنصة واضغط تفعيل مرة تانية",
      ];
    }
    if (isFirefox) {
      return [
        "اضغط على 🔒 القفل بجانب عنوان الموقع",
        "اضغط \"مسح هذا الإعداد\" بجانب الإشعارات",
        "أعد تحميل الصفحة واضغط تفعيل مرة تانية",
      ];
    }
    return [
      "افتح إعدادات المتصفح",
      "ابحث عن إعدادات \"الإشعارات\" أو \"الأذونات\"",
      "ابحث عن هذا الموقع واسمح بالإشعارات",
      "ارجع للمنصة واضغط تفعيل مرة تانية",
    ];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Settings className="w-5 h-5 text-primary" />
            الإشعارات محظورة
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            أنت محتاج تفعّل الإشعارات من إعدادات المتصفح الأول. اتبع الخطوات دي:
          </p>
          <ol className="space-y-2 text-sm">
            {getSteps().map((step, i) => (
              <li key={i} className="flex gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
            💡 بعد ما تفعّل الإشعارات من الإعدادات، ارجع هنا وحدّث الصفحة
          </div>
          <Button
            onClick={() => window.location.reload()}
            className="w-full gap-2"
            size="sm"
          >
            <ExternalLink className="w-4 h-4" />
            تحديث الصفحة بعد التفعيل
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const PushNotificationBanner = () => {
  const { isSupported, isSubscribed, permission, subscribe } = usePushNotifications();
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showBlocked, setShowBlocked] = useState(false);

  useEffect(() => {
    const wasDismissed = localStorage.getItem("push_banner_dismissed");
    if (wasDismissed) setDismissed(true);
  }, []);

  if (!isSupported || isSubscribed || dismissed) return null;

  const handleSubscribe = async () => {
    if (permission === "denied") {
      setShowBlocked(true);
      return;
    }
    setLoading(true);
    const success = await subscribe();
    setLoading(false);
    if (!success && Notification.permission === "denied") {
      setShowBlocked(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("push_banner_dismissed", "true");
  };

  return (
    <>
      <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
          {permission === "denied" ? (
            <BellOff className="w-5 h-5 text-destructive" />
          ) : (
            <Bell className="w-5 h-5 text-primary" />
          )}
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-sm">
            {permission === "denied" ? "الإشعارات محظورة" : "فعّل الإشعارات"}
          </h4>
          <p className="text-xs text-muted-foreground">
            {permission === "denied"
              ? "اضغط هنا لمعرفة كيفية تفعيل الإشعارات من الإعدادات"
              : "احصل على إشعارات فورية عند إضافة واجبات وامتحانات جديدة"}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button size="sm" onClick={handleSubscribe} disabled={loading} className="text-xs h-8">
            {loading ? "جاري..." : permission === "denied" ? "إعدادات" : "تفعيل"}
          </Button>
          <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <NotificationBlockedDialog open={showBlocked} onOpenChange={setShowBlocked} />
    </>
  );
};

export const PushNotificationToggle = () => {
  const { isSupported, isSubscribed, permission, subscribe, unsubscribe } = usePushNotifications();
  const [loading, setLoading] = useState(false);
  const [showBlocked, setShowBlocked] = useState(false);

  if (!isSupported) return null;

  const handleToggle = async () => {
    if (permission === "denied") {
      setShowBlocked(true);
      return;
    }
    setLoading(true);
    if (isSubscribed) {
      await unsubscribe();
    } else {
      const success = await subscribe();
      if (!success && Notification.permission === "denied") {
        setShowBlocked(true);
      }
    }
    setLoading(false);
  };

  return (
    <>
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg border transition-colors ${
          permission === "denied"
            ? "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20"
            : isSubscribed
              ? "bg-primary/10 text-primary border-primary/20"
              : "bg-muted text-muted-foreground border-border hover:border-primary/30"
        }`}
      >
        {isSubscribed ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
        {loading
          ? "جاري..."
          : permission === "denied"
            ? "الإشعارات محظورة — اضغط للتفعيل"
            : isSubscribed
              ? "الإشعارات مفعّلة ✓"
              : "تفعيل الإشعارات"}
      </button>
      <NotificationBlockedDialog open={showBlocked} onOpenChange={setShowBlocked} />
    </>
  );
};
