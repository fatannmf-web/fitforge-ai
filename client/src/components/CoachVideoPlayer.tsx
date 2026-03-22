import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize2, RotateCcw, ChevronRight } from "lucide-react";

interface CoachVideoPlayerProps {
  videoSrc: string;
  coachId: string;
  coachName: string;
  exerciseName: string;
  coachTip?: string;
  autoPlay?: boolean;
  onEnded?: () => void;
}

export default function CoachVideoPlayer({
  videoSrc,
  coachId,
  coachName,
  exerciseName,
  coachTip,
  autoPlay = false,
  onEnded,
}: CoachVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showTip, setShowTip] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [coachImgError, setCoachImgError] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (autoPlay) {
      videoRef.current?.play().then(() => setPlaying(true)).catch(() => {});
    }
  }, [autoPlay]);

  useEffect(() => {
    if (playing) {
      const timer = setTimeout(() => setShowTip(true), 3000);
      return () => clearTimeout(timer);
    } else {
      setShowTip(false);
    }
  }, [playing]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) { v.pause(); setPlaying(false); }
    else { v.play(); setPlaying(true); }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !muted;
    setMuted(!muted);
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    setProgress((v.currentTime / v.duration) * 100);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    v.currentTime = pct * v.duration;
  };

  const handleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen().catch(() => {});
    }
  };

  const resetVideo = () => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    v.play();
    setPlaying(true);
  };

  const showControlsTemporarily = () => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 2500);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const coachEmojis: Record<string, string> = {
    atlas: "🏋️", nova: "✨", vera: "🔥", max: "💪",
    bruno: "💪", kai: "🧘", alex: "⚡", sam: "🏃",
    rio: "🌊", luna: "🌙",
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-3xl overflow-hidden bg-black group"
      style={{ aspectRatio: "16/9" }}
      onMouseMove={showControlsTemporarily}
      onMouseEnter={showControlsTemporarily}
      onClick={togglePlay}
      data-testid="coach-video-player"
    >
      {/* VIDEO */}
      <video
        ref={videoRef}
        src={videoSrc}
        className="w-full h-full object-cover"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={e => setDuration((e.target as HTMLVideoElement).duration)}
        onEnded={() => { setPlaying(false); setShowTip(false); onEnded?.(); }}
        playsInline
        loop={false}
        data-testid="video-element"
      />

      {/* DARK GRADIENT overlay — top + bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

      {/* TOP BAR — exercise name */}
      <div className={`absolute top-0 left-0 right-0 p-4 flex items-center justify-between transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"}`}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-white text-xs font-bold uppercase tracking-widest opacity-80">LIVE DEMO</span>
        </div>
        <div className="text-white text-sm font-bold">{exerciseName}</div>
      </div>

      {/* COACH PiP — bottom left */}
      <div className="absolute bottom-14 left-4 flex items-end gap-2 z-10">
        <div className="relative">
          {/* Glow ring */}
          <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-primary to-purple-600 animate-pulse opacity-60" />
          <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white/80 shadow-2xl">
            {!coachImgError ? (
              <img
                src={`/coaches/${coachId}.png`}
                alt={coachName}
                className="w-full h-full object-cover"
                onError={() => setCoachImgError(true)}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-2xl">
                {coachEmojis[coachId] || "💪"}
              </div>
            )}
          </div>
          {/* Live dot */}
          <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 border-2 border-black flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
          </div>
        </div>

        {/* Coach name badge */}
        <div className="mb-1">
          <div className="bg-black/70 backdrop-blur-sm rounded-xl px-2.5 py-1.5 border border-white/10">
            <p className="text-white text-xs font-black">{coachName}</p>
            <p className="text-white/60 text-[9px] uppercase tracking-wider">AI Coach</p>
          </div>
        </div>
      </div>

      {/* COACH TIP bubble — bottom right, appears after 3s */}
      {showTip && coachTip && (
        <div className="absolute bottom-14 right-4 max-w-[55%] animate-in slide-in-from-right-4 duration-500 z-10">
          <div className="bg-black/75 backdrop-blur-md rounded-2xl rounded-br-sm px-3 py-2.5 border border-primary/30 shadow-xl">
            <p className="text-[10px] font-bold text-primary mb-1">{coachName} spune:</p>
            <p className="text-white text-xs leading-relaxed">{coachTip}</p>
            <button
              onClick={e => { e.stopPropagation(); setShowTip(false); }}
              className="mt-1.5 text-[9px] text-white/50 hover:text-white/80 flex items-center gap-0.5"
            >
              Închide <ChevronRight className="w-2.5 h-2.5" />
            </button>
          </div>
          {/* Triangle pointer */}
          <div className="absolute -bottom-1.5 right-3 w-3 h-3 bg-black/75 rotate-45 border-r border-b border-primary/30" />
        </div>
      )}

      {/* CENTER PLAY button (when paused) */}
      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-2xl animate-in zoom-in-50 duration-200">
            <Play className="w-8 h-8 text-white fill-white ml-1" />
          </div>
        </div>
      )}

      {/* BOTTOM CONTROLS */}
      <div className={`absolute bottom-0 left-0 right-0 px-4 pb-3 pt-2 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"}`}>
        {/* Progress bar */}
        <div
          className="w-full h-1.5 rounded-full bg-white/20 cursor-pointer mb-3 group/bar"
          onClick={e => { e.stopPropagation(); handleSeek(e); }}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-purple-500 relative transition-all"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-lg opacity-0 group-hover/bar:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              data-testid="button-toggle-play"
            >
              {playing
                ? <Pause className="w-4 h-4 text-white" />
                : <Play className="w-4 h-4 text-white fill-white ml-0.5" />
              }
            </button>

            <button
              onClick={resetVideo}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              data-testid="button-restart-video"
            >
              <RotateCcw className="w-3.5 h-3.5 text-white" />
            </button>

            <button
              onClick={toggleMute}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              data-testid="button-toggle-mute"
            >
              {muted
                ? <VolumeX className="w-3.5 h-3.5 text-white" />
                : <Volume2 className="w-3.5 h-3.5 text-white" />
              }
            </button>

            <span className="text-white/60 text-[11px] font-mono">
              {formatTime(duration * progress / 100)} / {formatTime(duration)}
            </span>
          </div>

          <button
            onClick={handleFullscreen}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            data-testid="button-fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
