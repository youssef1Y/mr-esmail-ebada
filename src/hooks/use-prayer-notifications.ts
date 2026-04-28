import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

const PRAYER_MESSAGES: Record<string, { title: string; body: string }> = {
  Fajr:    { title: "🌅 قم يا بطل!",         body: "يلا بسرعة صلّي الفجر وابدأ يومك بنور 🤲" },
  Dhuhr:   { title: "☀️ وقت صلاة الظهر!",    body: "قم يا بطل صلّي الظهر واتحلّى، وتعال كمّل 💪" },
  Asr:     { title: "🌤️ حان وقت العصر!",     body: "يلا يا بطل صلّي العصر ومتنساش الأذكار 📿" },
  Maghrib: { title: "🌇 أذان المغرب!",        body: "قم صلّي المغرب يا بطل وارجع كمّل دراستك 🌙" },
  Isha:    { title: "🌙 وقت صلاة العشاء!",   body: "صلّي العشاء يا بطل واختم يومك بطاعة ✨" },
};

async function fetchPrayerTimes(): Promise<Record<string, string> | null> {
  try {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    const res = await fetch(
      `https://api.aladhan.com/v1/timingsByCity/${dd}-${mm}-${yyyy}?city=Cairo&country=Egypt&method=5`
    );
    if (!res.ok) return null;
    const json = await res.json();
    const t = json?.data?.timings;
    if (!t) return null;
    return { Fajr: t.Fajr, Dhuhr: t.Dhuhr, Asr: t.Asr, Maghrib: t.Maghrib, Isha: t.Isha };
  } catch { return null; }
}

function parseTime(timeStr: string) {
  const [h, m] = timeStr.split(":").map(Number);
  return { hours: h, minutes: m };
}

/** إرسال إشعار Push محلي عبر الـ Service Worker */
async function showPrayerPushNotification(title: string, body: string) {
  try {
    if (!("serviceWorker" in navigator) || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const reg = await navigator.serviceWorker.getRegistration("/");
    if (!reg) return;

    await reg.showNotification(title, {
      body,
      icon: "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
      dir: "rtl",
      lang: "ar",
      vibrate: [300, 200, 300, 200, 300],
      requireInteraction: false,
      tag: "prayer-" + Date.now(),
      silent: false,
      data: { url: "/dashboard" },
    } as NotificationOptions);
  } catch (err) {
    console.error("[Prayer] showNotification error:", err);
  }
}

export function usePrayerNotifications() {
  const { toast } = useToast();
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const shownRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      const timings = await fetchPrayerTimes();
      if (cancelled || !timings) return;

      const now = new Date();
      const todayKey = now.toDateString();

      Object.entries(timings).forEach(([prayer, timeStr]) => {
        const { hours, minutes } = parseTime(timeStr);
        const prayerDate = new Date();
        prayerDate.setHours(hours, minutes, 0, 0);

        const diffMs = prayerDate.getTime() - now.getTime();
        const key = `${todayKey}-${prayer}`;

        if (diffMs > 0 && !shownRef.current.has(key)) {
          const timeout = setTimeout(async () => {
            if (cancelled) return;
            const msg = PRAYER_MESSAGES[prayer];
            if (!msg) return;

            shownRef.current.add(key);

            // ١. Toast داخل التطبيق
            toast({
              title: msg.title,
              description: msg.body,
              duration: 8000,
            });

            // ٢. Push notification (تظهر حتى لو التطبيق في الخلفية)
            await showPrayerPushNotification(msg.title, msg.body);
          }, diffMs);

          timeoutsRef.current.push(timeout);
        }
      });
    }

    setup();

    return () => {
      cancelled = true;
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, [toast]);
}
