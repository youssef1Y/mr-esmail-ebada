import { useState, useEffect, useCallback } from "react";
import AdBanner from "./AdBanner";

interface VideoAdOverlayProps {
  onSkip: () => void;
  onAdComplete: () => void;
  skipDelay?: number; // seconds before skip button appears
}

const VideoAdOverlay = ({ onSkip, onAdComplete, skipDelay = 5 }: VideoAdOverlayProps) => {
  const [countdown, setCountdown] = useState(skipDelay);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    if (countdown <= 0) {
      setCanSkip(true);
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSkip = useCallback(() => {
    if (canSkip) onSkip();
  }, [canSkip, onSkip]);

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/95">
      {/* Ad label */}
      <div className="absolute top-3 right-3 bg-yellow-500/90 text-black text-[10px] font-bold px-2.5 py-1 rounded-md shadow-lg">
        إعلان
      </div>

      {/* Ad content */}
      <div className="w-full max-w-md px-4">
        <AdBanner adSlot="XXXXXXXXXX" adFormat="rectangle" className="rounded-xl overflow-hidden" />
      </div>

      {/* Skip / Countdown button */}
      <div className="absolute bottom-4 left-4">
        {canSkip ? (
          <button
            onClick={handleSkip}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-sm font-bold px-4 py-2.5 rounded-lg border border-white/20 transition-all hover:scale-105 active:scale-95"
          >
            تخطي الإعلان
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 4 15 12 5 20 5 4" fill="currentColor" />
              <line x1="19" y1="5" x2="19" y2="19" />
            </svg>
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md text-white/80 text-sm px-4 py-2.5 rounded-lg border border-white/10">
            <span>تخطي خلال</span>
            <span className="bg-white/20 rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold">
              {countdown}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoAdOverlay;
