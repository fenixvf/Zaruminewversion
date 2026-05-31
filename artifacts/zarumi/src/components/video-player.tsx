import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, Play, Pause, Volume2, VolumeX, Maximize, Minimize, RotateCcw, RotateCw, ExternalLink } from 'lucide-react';
import { resolveLink } from '@workspace/api-client-react';

interface VideoPlayerProps {
  videoUrl: string;
  title?: string;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function VideoPlayer({ videoUrl, title }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [resolving, setResolving] = useState(true);
  const [resolveError, setResolveError] = useState(false);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [skipFeedback, setSkipFeedback] = useState<{ dir: 'left' | 'right'; key: number } | null>(null);

  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapRef = useRef<{ time: number; x: 'left' | 'right' } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setResolving(true);
    setResolveError(false);
    setResolvedUrl(null);

    resolveLink(videoUrl)
      .then(({ resolvedUrl }: { resolvedUrl: string }) => {
        if (!cancelled) {
          setResolvedUrl(resolvedUrl);
          setResolving(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResolveError(true);
          setResolving(false);
        }
      });

    return () => { cancelled = true; };
  }, [videoUrl]);

  const resetHideTimer = useCallback(() => {
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    setShowControls(true);
    hideControlsTimer.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setShowControls(false);
    }, 3000);
  }, []);

  useEffect(() => {
    return () => { if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current); };
  }, []);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
    resetHideTimer();
  }, [resetHideTimer]);

  const skip = useCallback((seconds: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + seconds));
    setSkipFeedback({ dir: seconds > 0 ? 'right' : 'left', key: Date.now() });
    resetHideTimer();
  }, [resetHideTimer]);

  const handleVideoClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!resolvedUrl || resolving) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const side: 'left' | 'right' = x < rect.width / 2 ? 'left' : 'right';
    const now = Date.now();
    const last = lastTapRef.current;

    if (last && now - last.time < 300 && last.x === side) {
      skip(side === 'left' ? -5 : 5);
      lastTapRef.current = null;
    } else {
      lastTapRef.current = { time: now, x: side };
      setTimeout(() => {
        if (lastTapRef.current && Date.now() - lastTapRef.current.time >= 280) {
          togglePlay();
          lastTapRef.current = null;
        }
      }, 300);
    }
  }, [resolvedUrl, resolving, skip, togglePlay]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!resolvedUrl || resolving) return;
    const touch = e.changedTouches[0];
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const side: 'left' | 'right' = x < rect.width / 2 ? 'left' : 'right';
    const now = Date.now();
    const last = lastTapRef.current;

    if (last && now - last.time < 300 && last.x === side) {
      e.preventDefault();
      skip(side === 'left' ? -5 : 5);
      lastTapRef.current = null;
    } else {
      lastTapRef.current = { time: now, x: side };
    }
  }, [resolvedUrl, resolving, skip]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Number(e.target.value);
    setCurrentTime(Number(e.target.value));
    resetHideTimer();
  }, [resetHideTimer]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const vol = Number(e.target.value);
    v.volume = vol;
    setVolume(vol);
    setMuted(vol === 0);
    resetHideTimer();
  }, [resetHideTimer]);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    resetHideTimer();
  }, [resetHideTimer]);

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
        setFullscreen(true);
      } else {
        await document.exitFullscreen();
        setFullscreen(false);
      }
    } catch {}
    resetHideTimer();
  }, [resetHideTimer]);

  useEffect(() => {
    const onFsChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!resolvedUrl) return;
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
      if (e.code === 'ArrowRight') { e.preventDefault(); skip(5); }
      if (e.code === 'ArrowLeft') { e.preventDefault(); skip(-5); }
      if (e.code === 'KeyF') toggleFullscreen();
      if (e.code === 'KeyM') toggleMute();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [resolvedUrl, togglePlay, skip, toggleFullscreen, toggleMute]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0;

  if (resolving) {
    return (
      <div className="w-full bg-black rounded-xl overflow-hidden border border-white/10">
        <div className="relative w-full aspect-video bg-zinc-950 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-zinc-400 text-sm">Carregando player...</span>
        </div>
      </div>
    );
  }

  if (resolveError || !resolvedUrl) {
    return (
      <div className="w-full bg-black rounded-xl overflow-hidden border border-white/10">
        <div className="relative w-full aspect-video bg-zinc-950 flex flex-col items-center justify-center gap-3">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="text-zinc-300 font-semibold">Erro ao carregar o vídeo</p>
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
            Abrir link direto
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black rounded-xl overflow-hidden border border-white/10 group select-none"
      onMouseMove={resetHideTimer}
      onMouseLeave={() => { if (playing) setShowControls(false); }}
      style={{ cursor: showControls ? 'default' : 'none' }}
    >
      <div
        className="relative w-full aspect-video"
        onClick={handleVideoClick}
        onTouchStart={handleTouchStart}
      >
        <video
          ref={videoRef}
          src={resolvedUrl}
          className="w-full h-full object-contain bg-black"
          preload="metadata"
          onPlay={() => { setPlaying(true); resetHideTimer(); }}
          onPause={() => { setPlaying(false); setShowControls(true); }}
          onTimeUpdate={() => {
            const v = videoRef.current;
            if (!v) return;
            setCurrentTime(v.currentTime);
            if (v.buffered.length > 0) setBuffered(v.buffered.end(v.buffered.length - 1));
          }}
          onLoadedMetadata={() => {
            const v = videoRef.current;
            if (!v) return;
            setDuration(v.duration);
            setLoading(false);
          }}
          onWaiting={() => setLoading(true)}
          onCanPlay={() => setLoading(false)}
          onError={() => { setLoading(false); setVideoError(true); }}
          onVolumeChange={() => {
            const v = videoRef.current;
            if (!v) return;
            setVolume(v.volume);
            setMuted(v.muted);
          }}
        />

        {loading && !videoError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10 pointer-events-none">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        )}

        {videoError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-950 z-10">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="text-zinc-300 font-semibold">Erro ao reproduzir o vídeo</p>
          </div>
        )}

        {!playing && !loading && !videoError && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className="h-20 w-20 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <Play className="h-9 w-9 fill-white text-white ml-1" />
            </div>
          </div>
        )}

        {skipFeedback && (
          <SkipAnimation key={skipFeedback.key} dir={skipFeedback.dir} />
        )}
      </div>

      <div
        className={`absolute bottom-0 left-0 right-0 z-20 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.85))' }}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <div className="px-4 pt-3 pb-1">
            <p className="text-white text-sm font-semibold truncate drop-shadow">{title}</p>
          </div>
        )}

        <div className="px-4 pb-1 relative h-4 flex items-center group/seek">
          <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-1 rounded-full bg-white/20 overflow-hidden pointer-events-none">
            <div className="h-full rounded-full bg-white/30" style={{ width: `${bufferedPercent}%` }} />
            <div className="absolute inset-y-0 left-0 h-full rounded-full bg-primary" style={{ width: `${progressPercent}%` }} />
          </div>
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-4 appearance-none bg-transparent cursor-pointer relative z-10"
            style={{
              WebkitAppearance: 'none',
              background: 'transparent',
            }}
          />
        </div>

        <div className="px-3 pb-3 flex items-center gap-1">
          <button
            onClick={togglePlay}
            className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-white/10 text-white transition-colors"
            title={playing ? 'Pausar' : 'Reproduzir'}
          >
            {playing ? <Pause className="h-5 w-5 fill-white" /> : <Play className="h-5 w-5 fill-white ml-0.5" />}
          </button>

          <button
            onClick={() => skip(-5)}
            className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-white/10 text-white transition-colors"
            title="Retroceder 5s"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            onClick={() => skip(5)}
            className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-white/10 text-white transition-colors"
            title="Avançar 5s"
          >
            <RotateCw className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-1 group/vol">
            <button
              onClick={toggleMute}
              className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-white/10 text-white transition-colors"
              title={muted ? 'Ativar som' : 'Mudo'}
            >
              {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <div className="w-0 overflow-hidden group-hover/vol:w-20 transition-all duration-200">
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 cursor-pointer accent-primary"
              />
            </div>
          </div>

          <span className="text-white/70 text-xs font-mono ml-1 select-none whitespace-nowrap">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="flex-1" />

          <button
            onClick={toggleFullscreen}
            className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-white/10 text-white transition-colors"
            title={fullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
          >
            {fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <style>{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 0 3px rgba(0,0,0,0.5);
        }
        input[type=range]::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
}

function SkipAnimation({ dir }: { dir: 'left' | 'right' }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 700);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`absolute top-0 bottom-0 ${dir === 'left' ? 'left-0' : 'right-0'} w-1/3 flex items-center justify-center z-20 pointer-events-none`}
      style={{ background: dir === 'left' ? 'linear-gradient(to right, rgba(255,255,255,0.08), transparent)' : 'linear-gradient(to left, rgba(255,255,255,0.08), transparent)', borderRadius: dir === 'left' ? '12px 0 0 12px' : '0 12px 12px 0' }}
    >
      <div className="flex flex-col items-center gap-1 animate-pulse">
        {dir === 'left' ? (
          <RotateCcw className="h-7 w-7 text-white drop-shadow" />
        ) : (
          <RotateCw className="h-7 w-7 text-white drop-shadow" />
        )}
        <span className="text-white text-xs font-bold drop-shadow">{dir === 'left' ? '-5s' : '+5s'}</span>
      </div>
    </div>
  );
}
