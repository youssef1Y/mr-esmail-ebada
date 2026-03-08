import { useState, useEffect } from "react";
import { Bell, BellOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/use-push-notifications";

export const PushNotificationBanner = () => {
  const { isSupported, isSubscribed, permission, subscribe } = usePushNotifications();
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const wasDismissed = localStorage.getItem("push_banner_dismissed");
    if (wasDismissed) setDismissed(true);
  }, []);

  if (!isSupported || isSubscribed || permission === "denied" || dismissed) return null;

  const handleSubscribe = async () => {
    setLoading(true);
    await subscribe();
    setLoading(false);
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("push_banner_dismissed", "true");
  };

  return (
    <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
        <Bell className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-sm">فعّل الإشعارات</h4>
        <p className="text-xs text-muted-foreground">احصل على إشعارات فورية عند إضافة واجبات وامتحانات جديدة</p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <Button size="sm" onClick={handleSubscribe} disabled={loading} className="text-xs h-8">
          {loading ? "جاري..." : "تفعيل"}
        </Button>
        <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const PushNotificationToggle = () => {
  const { isSupported, isSubscribed, permission, subscribe, unsubscribe } = usePushNotifications();
  const [loading, setLoading] = useState(false);

  if (!isSupported) return null;

  const handleToggle = async () => {
    setLoading(true);
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
    setLoading(false);
  };

  if (permission === "denied") {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <BellOff className="w-4 h-4" />
        <span>الإشعارات محظورة من المتصفح</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg border transition-colors ${
        isSubscribed
          ? "bg-primary/10 text-primary border-primary/20"
          : "bg-muted text-muted-foreground border-border hover:border-primary/30"
      }`}
    >
      {isSubscribed ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
      {loading ? "جاري..." : isSubscribed ? "الإشعارات مفعّلة ✓" : "تفعيل الإشعارات"}
    </button>
  );
};
