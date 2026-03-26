import { useRef, useState, useEffect, useCallback } from "react";
import {
  Play, Pause, Maximize, Minimize, RotateCcw, RotateCw,
  Volume2, VolumeX, Volume1, Settings, Loader2, PictureInPicture2
} from "lucide-react";


interface VideoPlayerProps {
  src: string;
  title?: string;
  onRefreshSource?: () => Promise<boolean>;
  
}

const formatTime = (seconds: number) => {
  if (!seconds || !isFinite(seconds)) return "0:00";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

const VideoPlayer = ({ src, title, onRefreshSource }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout>>();
  const refreshingSourceRef = useRef(false);
  const doubleTapTimer = useRef<ReturnType<typeof setTimeout>>();
  const volumeSliderTimer = useRef<ReturnType<typeof setTimeout>>();

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [seeking, setSeeking] = useState(false);
  const [skipIndicator, setSkipIndicator] = useState<{ side: "forward" | "backward"; amount: number } | null>(null);
  const [error, setError] = useState(false);
  const [refreshingSource, setRefreshingSource] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState(0);
  const [tapCount, setTapCount] = useState(0);
  const [tapSide, setTapSide] = useState<"left" | "right" | null>(null);
  const [isPiP, setIsPiP] = useState(false);

  // ── Source refresh ──
  const refreshSource = useCallback(async () => {
    if (!onRefreshSource || refreshingSourceRef.current) return false;
    refreshingSourceRef.current = true;
    setRefreshingSource(true);
    try {
      const refreshed = await onRefreshSource();
      if (refreshed) setError(false);
      return refreshed;
    } finally {
      refreshingSourceRef.current = false;
      setRefreshingSource(false);
    }
  }, [onRefreshSource]);

  // ── Controls ──
  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.paused ? v.play().catch(() => {}) : v.pause();
  }, []);

  const skip = useCallback((seconds: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + seconds));
    setSkipIndicator({ side: seconds > 0 ? "forward" : "backward", amount: Math.abs(seconds) });
    setTimeout(() => setSkipIndicator(null), 800);
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

  const togglePiP = useCallback(async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await v.requestPictureInPicture();
      }
    } catch {}
  }, []);

  const changePlaybackRate = useCallback((rate: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
  }, []);

  const handleVolumeChange = useCallback((newVol: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = newVol;
    v.muted = newVol === 0;
    setVolume(newVol);
    setMuted(newVol === 0);
  }, []);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }, []);

  // ── Progress bar interaction ──
  const handleProgressInteraction = useCallback((clientX: number, commit: boolean) => {
    const bar = progressBarRef.current;
    const v = videoRef.current;
    if (!bar || !v || !duration) return;
    const rect = bar.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const time = fraction * duration;
    if (commit) {
      v.currentTime = time;
      setCurrentTime(time);
    }
    setHoverTime(time);
    setHoverPosition(fraction * 100);
  }, [duration]);

  const handleProgressMouseDown = useCallback((e: React.MouseEvent) => {
    setSeeking(true);
    handleProgressInteraction(e.clientX, true);
    const onMove = (ev: MouseEvent) => handleProgressInteraction(ev.clientX, true);
    const onUp = () => {
      setSeeking(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [handleProgressInteraction]);

  const handleProgressTouchStart = useCallback((e: React.TouchEvent) => {
    setSeeking(true);
    handleProgressInteraction(e.touches[0].clientX, true);
  }, [handleProgressInteraction]);

  const handleProgressTouchMove = useCallback((e: React.TouchEvent) => {
    handleProgressInteraction(e.touches[0].clientX, true);
  }, [handleProgressInteraction]);

  // ── Double tap to skip (mobile YouTube style) ──
  const handleVideoAreaTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const clientX = "touches" in e ? e.changedTouches[0].clientX : e.clientX;
    const relativeX = (clientX - rect.left) / rect.width;
    const side = relativeX < 0.35 ? "left" : relativeX > 0.65 ? "right" : null;

    if (side) {
      clearTimeout(doubleTapTimer.current);
      const newCount = tapSide === side ? tapCount + 1 : 1;
      setTapCount(newCount);
      setTapSide(side);

      if (newCount >= 2) {
        skip(side === "right" ? 10 : -10);
        setTapCount(0);
        setTapSide(null);
        return;
      }

      doubleTapTimer.current = setTimeout(() => {
        togglePlay();
        setTapCount(0);
        setTapSide(null);
      }, 300);
    } else {
      togglePlay();
    }
  }, [tapCount, tapSide, skip, togglePlay]);

  // ── Controls visibility ──
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideControlsTimer.current);
    if (playing) {
      hideControlsTimer.current = setTimeout(() => {
        setShowControls(false);
        setShowSpeedMenu(false);
        setShowVolumeSlider(false);
      }, 3500);
    }
  }, [playing]);

  // ── Video events ──
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    setError(false);

    const onTimeUpdate = () => {
      if (!seeking) setCurrentTime(v.currentTime);
      if (v.buffered.length > 0) {
        setBuffered(v.buffered.end(v.buffered.length - 1));
      }
    };
    const onLoadedMetadata = () => {
      setDuration(v.duration);
      v.play().catch(() => {});
    };
    const onEnded = () => setPlaying(false);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => setIsBuffering(false);
    const onCanPlay = () => { setError(false); setIsBuffering(false); };
    const onProgress = () => {
      if (v.buffered.length > 0) {
        setBuffered(v.buffered.end(v.buffered.length - 1));
      }
    };

    const onEnterPiP = () => setIsPiP(true);
    const onLeavePiP = () => setIsPiP(false);

    let retryCount = 0;
    const MAX_RETRIES = 3;
    const onError = async () => {
      if (v.error?.code === MediaError.MEDIA_ERR_ABORTED) return;
      retryCount++;
      if (retryCount <= MAX_RETRIES) {
        const refreshed = await refreshSource();
        if (!refreshed) {
          setTimeout(() => v.load(), 1000 * retryCount);
        }
      } else {
        setError(true);
      }
    };

    const onStalled = () => {
      setIsBuffering(true);
      setTimeout(() => {
        if (v.readyState < 3 && !v.paused) {
          const pos = v.currentTime;
          v.load();
          v.currentTime = pos;
          v.play().catch(() => {});
        }
      }, 3000);
    };

    v.addEventListener("timeupdate", onTimeUpdate);
    v.addEventListener("loadedmetadata", onLoadedMetadata);
    v.addEventListener("ended", onEnded);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("waiting", onWaiting);
    v.addEventListener("playing", onPlaying);
    v.addEventListener("canplay", onCanPlay);
    v.addEventListener("progress", onProgress);
    v.addEventListener("error", onError);
    v.addEventListener("stalled", onStalled);
    v.addEventListener("enterpictureinpicture", onEnterPiP);
    v.addEventListener("leavepictureinpicture", onLeavePiP);

    v.load();

    return () => {
      v.removeEventListener("timeupdate", onTimeUpdate);
      v.removeEventListener("loadedmetadata", onLoadedMetadata);
      v.removeEventListener("ended", onEnded);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("waiting", onWaiting);
      v.removeEventListener("playing", onPlaying);
      v.removeEventListener("canplay", onCanPlay);
      v.removeEventListener("progress", onProgress);
      v.removeEventListener("error", onError);
      v.removeEventListener("stalled", onStalled);
      v.removeEventListener("enterpictureinpicture", onEnterPiP);
      v.removeEventListener("leavepictureinpicture", onLeavePiP);
    };
  }, [src, seeking, refreshSource]);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  useEffect(() => {
    resetControlsTimer();
    return () => clearTimeout(hideControlsTimer.current);
  }, [playing, resetControlsTimer]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement) && document.activeElement !== document.body) return;
      switch (e.key) {
        case " ": case "k": e.preventDefault(); togglePlay(); break;
        case "ArrowRight": e.preventDefault(); skip(10); break;
        case "ArrowLeft": e.preventDefault(); skip(-10); break;
        case "ArrowUp": e.preventDefault(); handleVolumeChange(Math.min(1, volume + 0.1)); break;
        case "ArrowDown": e.preventDefault(); handleVolumeChange(Math.max(0, volume - 0.1)); break;
        case "f": e.preventDefault(); toggleFullscreen(); break;
        case "m": e.preventDefault(); toggleMute(); break;
        case "p": e.preventDefault(); togglePiP(); break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [togglePlay, skip, toggleFullscreen, toggleMute, handleVolumeChange, volume, togglePiP]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedProgress = duration > 0 ? (buffered / duration) * 100 : 0;

  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div
      ref={containerRef}
      className="relative bg-black w-full aspect-video group select-none overflow-hidden rounded-t-2xl"
      onMouseMove={resetControlsTimer}
      onTouchStart={resetControlsTimer}
      onContextMenu={(e) => e.preventDefault()}
      tabIndex={0}
      style={{ outline: "none" }}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain"
        playsInline
        preload="auto"
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Pre-roll Ad Overlay */}
      {adVisible && (
        <VideoAdOverlay
          onSkip={() => {
            setAdVisible(false);
            videoRef.current?.play().catch(() => {});
          }}
          onAdComplete={() => {
            setAdVisible(false);
            videoRef.current?.play().catch(() => {});
          }}
        />
      )}

      {/* Buffering Spinner */}
      {isBuffering && playing && !error && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center">
            <Loader2 className="w-9 h-9 text-white animate-spin" />
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-white gap-4 z-30">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
            <RotateCcw className="w-8 h-8" />
          </div>
          <p className="text-sm font-medium">
            {refreshingSource ? "جارٍ تحديث رابط الفيديو..." : "حدث خطأ في تحميل الفيديو"}
          </p>
          <button
            onClick={async () => {
              const refreshed = await refreshSource();
              if (!refreshed) { setError(false); videoRef.current?.load(); }
            }}
            disabled={refreshingSource}
            className="bg-white text-black px-5 py-2.5 rounded-full text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-50"
          >
            {refreshingSource ? "جاري المحاولة..." : "إعادة المحاولة"}
          </button>
        </div>
      )}

      {/* Skip Indicator (YouTube-style ripple) */}
      {skipIndicator && (
        <div className={`absolute top-0 bottom-0 ${skipIndicator.side === "forward" ? "right-0" : "left-0"} w-2/5 flex items-center justify-center pointer-events-none z-30`}>
          <div className="flex flex-col items-center gap-1.5 animate-fade-in">
            <div className="bg-black/50 backdrop-blur-md rounded-full p-5">
              {skipIndicator.side === "forward"
                ? <RotateCw className="w-8 h-8 text-white" />
                : <RotateCcw className="w-8 h-8 text-white" />}
            </div>
            <span className="text-white text-xs font-bold bg-black/50 backdrop-blur-md rounded-full px-3 py-1">
              {skipIndicator.amount} ثانية
            </span>
          </div>
        </div>
      )}

      {/* Center Play/Pause (when paused & no error) */}
      {!playing && !error && !isBuffering && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30 z-10 transition-opacity"
        >
          <div className="w-20 h-20 rounded-full bg-primary/80 backdrop-blur-md flex items-center justify-center hover:bg-primary transition-all hover:scale-110 shadow-2xl">
            <Play className="w-10 h-10 text-primary-foreground ml-1" fill="currentColor" />
          </div>
        </button>
      )}

      {/* Tap area for double-tap skip (when playing) */}
      {playing && !error && (
        <div className="absolute inset-0 z-10" onClick={handleVideoAreaTap} />
      )}

      {/* Title bar (top) */}
      {title && (
        <div className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent pt-3 pb-10 px-4 transition-opacity duration-300 z-20 ${
          showControls || !playing ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}>
          <p className="text-white text-sm font-semibold truncate text-right drop-shadow-lg">{title}</p>
        </div>
      )}

      {/* Bottom Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 transition-opacity duration-300 z-20 ${
          showControls || !playing ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

        <div className="relative px-3 pb-2.5 pt-10">
          {/* Progress Bar */}
          <div
            ref={progressBarRef}
            className="group/progress relative h-6 flex items-center cursor-pointer mb-1.5"
            onMouseDown={handleProgressMouseDown}
            onTouchStart={handleProgressTouchStart}
            onTouchMove={handleProgressTouchMove}
            onTouchEnd={() => setSeeking(false)}
            onMouseMove={(e) => {
              const rect = progressBarRef.current?.getBoundingClientRect();
              if (!rect || !duration) return;
              const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
              setHoverTime(frac * duration);
              setHoverPosition(frac * 100);
            }}
            onMouseLeave={() => setHoverTime(null)}
          >
            {/* Hover time tooltip */}
            {hoverTime !== null && (
              <div
                className="absolute -top-9 transform -translate-x-1/2 bg-black/95 text-white text-[10px] font-mono px-2.5 py-1 rounded-md pointer-events-none whitespace-nowrap shadow-lg border border-white/10"
                style={{ left: `${hoverPosition}%` }}
              >
                {formatTime(hoverTime)}
              </div>
            )}

            {/* Track layers */}
            <div className="absolute left-0 right-0 h-[3px] group-hover/progress:h-[5px] transition-all rounded-full bg-white/20">
              {/* Buffered */}
              <div
                className="absolute inset-y-0 left-0 bg-white/30 rounded-full transition-all"
                style={{ width: `${bufferedProgress}%` }}
              />
              {/* Played */}
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-100"
                style={{
                  width: `${progress}%`,
                  background: "hsl(var(--primary))",
                }}
              />
            </div>

            {/* Thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-[14px] h-[14px] rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity pointer-events-none shadow-lg ring-2 ring-white/20"
              style={{
                left: `${progress}%`,
                transform: `translate(-50%, -50%)`,
                background: "hsl(var(--primary))",
              }}
            />
          </div>

          {/* Controls Row */}
          <div className="flex items-center gap-1">
            {/* Play/Pause */}
            <button onClick={togglePlay} className="text-white p-1.5 hover:bg-white/10 rounded-full transition-colors">
              {playing ? <Pause className="w-5 h-5" fill="white" /> : <Play className="w-5 h-5 ml-0.5" fill="white" />}
            </button>

            {/* Skip buttons */}
            <button onClick={() => skip(-10)} className="text-white p-1.5 hover:bg-white/10 rounded-full transition-colors">
              <RotateCcw className="w-[18px] h-[18px]" />
            </button>
            <button onClick={() => skip(10)} className="text-white p-1.5 hover:bg-white/10 rounded-full transition-colors">
              <RotateCw className="w-[18px] h-[18px]" />
            </button>

            {/* Volume */}
            <div
              className="relative flex items-center"
              onMouseEnter={() => {
                clearTimeout(volumeSliderTimer.current);
                setShowVolumeSlider(true);
              }}
              onMouseLeave={() => {
                volumeSliderTimer.current = setTimeout(() => setShowVolumeSlider(false), 300);
              }}
            >
              <button onClick={toggleMute} className="text-white p-1.5 hover:bg-white/10 rounded-full transition-colors">
                <VolumeIcon className="w-[18px] h-[18px]" />
              </button>
              <div className={`overflow-hidden transition-all duration-200 ${showVolumeSlider ? "w-20 opacity-100 ml-1" : "w-0 opacity-0"}`}>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={muted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-full h-1 appearance-none bg-white/30 rounded-full cursor-pointer accent-white [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, white ${(muted ? 0 : volume) * 100}%, rgba(255,255,255,0.3) ${(muted ? 0 : volume) * 100}%)`
                  }}
                />
              </div>
            </div>

            {/* Time */}
            <span className="text-white/90 text-[11px] font-mono tabular-nums mx-1 select-none">
              {formatTime(currentTime)}
              <span className="text-white/40 mx-0.5">/</span>
              {formatTime(duration)}
            </span>

            <div className="flex-1" />

            {/* Speed */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="text-white p-1.5 hover:bg-white/10 rounded-full transition-colors text-xs font-bold min-w-[36px]"
              >
                {playbackRate === 1 ? <Settings className="w-[18px] h-[18px]" /> : `${playbackRate}x`}
              </button>
              {showSpeedMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-black/95 backdrop-blur-xl rounded-xl border border-white/10 py-1.5 min-w-[110px] shadow-2xl">
                  <p className="text-white/40 text-[10px] px-3 py-1 font-medium">سرعة التشغيل</p>
                  {PLAYBACK_RATES.map(rate => (
                    <button
                      key={rate}
                      onClick={() => changePlaybackRate(rate)}
                      className={`w-full text-right px-3 py-2 text-xs transition-colors flex items-center justify-between ${
                        rate === playbackRate ? "text-primary bg-white/10" : "text-white hover:bg-white/10"
                      }`}
                    >
                      <span>{rate === 1 ? "عادي" : `${rate}x`}</span>
                      {rate === playbackRate && <span className="text-primary text-[8px]">●</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* PiP */}
            {'pictureInPictureEnabled' in document && (
              <button
                onClick={togglePiP}
                className={`text-white p-1.5 hover:bg-white/10 rounded-full transition-colors ${isPiP ? 'text-primary' : ''}`}
                title="صورة داخل صورة"
              >
                <PictureInPicture2 className="w-[18px] h-[18px]" />
              </button>
            )}

            {/* Fullscreen */}
            <button onClick={toggleFullscreen} className="text-white p-1.5 hover:bg-white/10 rounded-full transition-colors">
              {isFullscreen ? <Minimize className="w-[18px] h-[18px]" /> : <Maximize className="w-[18px] h-[18px]" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
