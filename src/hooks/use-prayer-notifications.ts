import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

// Prayer names in Arabic with motivational messages
const PRAYER_MESSAGES: Record<string, { title: string; body: string }> = {
  Fajr: {
    title: "🌅 قم يا بطل!",
    body: "يلا بسرعة صلّي الفجر وابدأ يومك بنور 🤲",
  },
  Dhuhr: {
    title: "☀️ وقت صلاة الظهر!",
    body: "قم يا بطل صلّي الظهر واتحلّى، وتعال كمّل 💪",
  },
  Asr: {
    title: "🌤️ حان وقت العصر!",
    body: "يلا يا بطل صلّي العصر ومتنساش الأذكار 📿",
  },
  Maghrib: {
    title: "🌇 أذان المغرب!",
    body: "قم صلّي المغرب يا بطل وارجع كمّل دراستك 🌙",
  },
  Isha: {
    title: "🌙 وقت صلاة العشاء!",
    body: "صلّي العشاء يا بطل واختم يومك بطاعة ✨",
  },
};

// Fetch prayer times from Aladhan API for Cairo, Egypt
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
    const timings = json?.data?.timings;
    if (!timings) return null;

    return {
      Fajr: timings.Fajr,
      Dhuhr: timings.Dhuhr,
      Asr: timings.Asr,
      Maghrib: timings.Maghrib,
      Isha: timings.Isha,
    };
  } catch (err) {
    console.error("Prayer times fetch error:", err);
    return null;
  }
}

function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [h, m] = timeStr.split(":").map(Number);
  return { hours: h, minutes: m };
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
      // Get today's shown key prefix
      const todayKey = now.toDateString();

      Object.entries(timings).forEach(([prayer, timeStr]) => {
        const { hours, minutes } = parseTime(timeStr);
        const prayerDate = new Date();
        prayerDate.setHours(hours, minutes, 0, 0);

        const diffMs = prayerDate.getTime() - now.getTime();
        const key = `${todayKey}-${prayer}`;

        // Only schedule if prayer time is in the future and not already shown
        if (diffMs > 0 && !shownRef.current.has(key)) {
          const timeout = setTimeout(() => {
            if (cancelled) return;
            const msg = PRAYER_MESSAGES[prayer];
            if (msg) {
              shownRef.current.add(key);
              toast({
                title: msg.title,
                description: msg.body,
                duration: 6000, // Auto-dismiss after 6 seconds
              });
            }
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
