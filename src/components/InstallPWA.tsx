import { useState, useEffect, useCallback } from "react";
import { Download, X, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as any).standalone === true;

export const InstallPWABanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [sessionDismissed, setSessionDismissed] = useState(false);

  useEffect(() => {
    // If already installed as standalone, don't show
    if (isStandalone()) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Listen for app installed event
    const installedHandler = () => {
      setShowBanner(false);
      setDeferredPrompt(null);
    };
    window.addEventListener("appinstalled", installedHandler);

    // Re-check standalone mode periodically (for uninstall detection)
    const standaloneQuery = window.matchMedia("(display-mode: standalone)");
    const standaloneChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setShowBanner(false);
      }
    };
    standaloneQuery.addEventListener("change", standaloneChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
      standaloneQuery.removeEventListener("change", standaloneChange);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowBanner(false);
      }
    } catch (err) {
      console.error("Install prompt error:", err);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = () => {
    setSessionDismissed(true);
  };

  if (!showBanner || sessionDismissed || isStandalone()) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-card border-2 border-primary/30 rounded-2xl p-4 shadow-xl max-w-md mx-auto">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm mb-1">حمّل التطبيق على موبايلك 📱</h3>
            <p className="text-xs text-muted-foreground mb-3">
              ثبّت المنصة كتطبيق على جهازك لتجربة أسرع وإشعارات فورية
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleInstall} className="gap-1.5 flex-1" disabled={!deferredPrompt}>
                <Download className="w-3.5 h-3.5" />
                تثبيت التطبيق
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDismiss} className="px-2">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const InstallPWAButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setIsInstalled(true));

    const standaloneQuery = window.matchMedia("(display-mode: standalone)");
    const onChange = (e: MediaQueryListEvent) => {
      setIsInstalled(e.matches);
    };
    standaloneQuery.addEventListener("change", onChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      standaloneQuery.removeEventListener("change", onChange);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } catch (err) {
      console.error("Install prompt error:", err);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled) return null;

  return (
    <Button
      onClick={handleInstall}
      variant="outline"
      className="gap-2 border-primary/30 hover:bg-primary/10"
      disabled={!deferredPrompt}
    >
      <Download className="w-4 h-4" />
      تثبيت التطبيق
    </Button>
  );
};
