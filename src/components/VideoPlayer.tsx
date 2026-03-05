import { useRef, useState, useEffect, useCallback } from "react";
import { Play, Pause, Maximize, Minimize, RotateCcw, RotateCw, Volume2, VolumeX } from "lucide-react";

interface VideoPlayerProps {
  src: string;
  title?: string;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const VideoPlayer = ({ src, title }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout>>();

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [seeking, setSeeking] = useState(false);
  const [skipIndicator, setSkipIndicator] = useState<"forward" | "backward" | null>(null);
  const [error, setError] = useState(false);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, []);

  const skip = useCallback((seconds: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + seconds));
    setSkipIndicator(seconds > 0 ? "forward" : "backward");
    setTimeout(() => setSkipIndicator(null), 600);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
        try { await (screen.orientation as any)?.lock?.("landscape"); } catch {}
      } else {
        await document.exitFullscreen();
        try { screen.orientation?.unlock?.(); } catch {}
      }
    } catch {}
  }, []);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const time = parseFloat(e.target.value);
    v.currentTime = time;
    setCurrentTime(time);
  }, []);

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideControlsTimer.current);
    if (playing) {
      hideControlsTimer.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [playing]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onTimeUpdate = () => !seeking && setCurrentTime(v.currentTime);
    const onLoadedMetadata = () => {
      setDuration(v.duration);
      v.play().catch(() => {});
    };
    const onEnded = () => setPlaying(false);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onError = () => setError(true);
    const onCanPlay = () => setError(false);

    v.addEventListener("timeupdate", onTimeUpdate);
    v.addEventListener("loadedmetadata", onLoadedMetadata);
    v.addEventListener("ended", onEnded);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("error", onError);
    v.addEventListener("canplay", onCanPlay);

    // Force load
    v.load();

    return () => {
      v.removeEventListener("timeupdate", onTimeUpdate);
      v.removeEventListener("loadedmetadata", onLoadedMetadata);
      v.removeEventListener("ended", onEnded);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("error", onError);
      v.removeEventListener("canplay", onCanPlay);
    };
  }, [src, seeking]);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  useEffect(() => {
    resetControlsTimer();
    return () => clearTimeout(hideControlsTimer.current);
  }, [playing, resetControlsTimer]);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }, []);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative bg-black w-full aspect-video group select-none"
      onMouseMove={resetControlsTimer}
      onTouchStart={resetControlsTimer}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain"
        playsInline
        preload="auto"
        crossOrigin="anonymous"
      />

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white gap-3">
          <p className="text-sm">حدث خطأ في تحميل الفيديو</p>
          <button
            onClick={() => {
              setError(false);
              videoRef.current?.load();
            }}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Skip Indicator */}
      {skipIndicator && (
        <div className={`absolute top-1/2 -translate-y-1/2 ${skipIndicator === "forward" ? "right-8" : "left-8"} animate-fade-in pointer-events-none`}>
          <div className="bg-black/60 text-white rounded-full p-3">
            {skipIndicator === "forward" ? <RotateCw className="w-8 h-8" /> : <RotateCcw className="w-8 h-8" />}
          </div>
        </div>
      )}

      {/* Center Play Button (when paused & no error) */}
      {!playing && !error && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30 z-10"
        >
          <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center">
            <Play className="w-8 h-8 text-primary-foreground ml-1" />
          </div>
        </button>
      )}

      {/* Tap to pause when playing */}
      {playing && (
        <div
          className="absolute inset-0 z-10"
          onClick={togglePlay}
        />
      )}

      {/* Controls Overlay */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-10 pb-2 px-3 transition-opacity duration-300 z-20 ${
          showControls || !playing ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress Bar */}
        <div className="relative mb-2">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            onMouseDown={() => setSeeking(true)}
            onMouseUp={() => setSeeking(false)}
            onTouchStart={() => setSeeking(true)}
            onTouchEnd={() => setSeeking(false)}
            className="w-full h-1.5 appearance-none bg-white/30 rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer"
            style={{
              background: `linear-gradient(to right, hsl(var(--primary)) ${progress}%, rgba(255,255,255,0.3) ${progress}%)`,
            }}
          />
        </div>

        {/* Controls Row */}
        <div className="flex items-center gap-2">
          <button onClick={togglePlay} className="text-white p-1">
            {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>

          <button onClick={() => skip(-10)} className="text-white p-1">
            <RotateCcw className="w-4 h-4" />
          </button>
          <button onClick={() => skip(10)} className="text-white p-1">
            <RotateCw className="w-4 h-4" />
          </button>

          <span className="text-white text-[11px] font-mono tabular-nums mx-1">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="flex-1" />

          <button onClick={toggleMute} className="text-white p-1">
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button onClick={toggleFullscreen} className="text-white p-1">
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
