"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Pause, Play, RotateCcw, RotateCw } from "lucide-react";
import { formatClock } from "@/lib/format";

const SPEEDS = [0.5, 1, 1.25, 1.5, 1.75, 2] as const;

export type MediaPlayerHandle = {
  /** Seek playhead to an absolute time in seconds (transcript start_time). */
  seekTo: (seconds: number) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  skipBy: (deltaSeconds: number) => void;
  setSpeed: (rate: number) => void;
};

type MediaPlayerProps = {
  /** Optional audio URL; falls back to synthetic timer when missing/unloadable */
  src?: string;
  /** Meeting/transcript timeline length (authoritative for seek + UI) */
  durationSeconds: number;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  onPlayingChange?: (playing: boolean) => void;
  /** video = surface only (detail page uses bottom bar); full = inline controls */
  chrome?: "full" | "video";
  playbackRate?: number;
  onPlaybackRateChange?: (rate: number) => void;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export const MediaPlayer = forwardRef<MediaPlayerHandle, MediaPlayerProps>(
  function MediaPlayer(
    {
      src = "/audio/sample-meeting.wav",
      durationSeconds,
      currentTime,
      onTimeUpdate,
      onPlayingChange,
      chrome = "full",
      playbackRate,
      onPlaybackRateChange,
    },
    ref
  ) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const rafRef = useRef<number | null>(null);
    const fakePlayingRef = useRef(false);
    const fakeTimeRef = useRef(0);
    const lastTickRef = useRef<number | null>(null);
    const onTimeUpdateRef = useRef(onTimeUpdate);
    const seekingRef = useRef(false);

    const [playing, setPlaying] = useState(false);
    const [audioReady, setAudioReady] = useState(false);
    const [audioFileDuration, setAudioFileDuration] = useState(0);
    const [speed, setSpeedState] = useState(playbackRate ?? 1);
    const [speedOpen, setSpeedOpen] = useState(false);
    const speedRef = useRef(1);

    const setSpeed = useCallback(
      (rate: number) => {
        setSpeedState(rate);
        onPlaybackRateChange?.(rate);
      },
      [onPlaybackRateChange]
    );

    useEffect(() => {
      if (playbackRate != null && playbackRate !== speed) {
        setSpeedState(playbackRate);
      }
    }, [playbackRate, speed]);

    useEffect(() => {
      speedRef.current = speed;
      const audio = audioRef.current;
      if (audio) audio.playbackRate = speed;
    }, [speed]);

    // Transcript timeline length is authoritative for the demo player.
    // Do not extend this with the sample audio file length or meeting metadata.
    const timelineDuration = Math.max(durationSeconds, 1);

    useEffect(() => {
      onTimeUpdateRef.current = onTimeUpdate;
    }, [onTimeUpdate]);

    const stopRaf = useCallback(() => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      lastTickRef.current = null;
    }, []);

    const setPlayingState = useCallback(
      (next: boolean) => {
        setPlaying(next);
        onPlayingChange?.(next);
      },
      [onPlayingChange]
    );

    const emitTime = useCallback((t: number) => {
      const clamped = clamp(t, 0, timelineDuration);
      fakeTimeRef.current = clamped;
      onTimeUpdateRef.current(clamped);
    }, [timelineDuration]);

    const tickFake = useCallback(
      (now: number) => {
        if (!fakePlayingRef.current) return;
        if (lastTickRef.current == null) lastTickRef.current = now;
        const delta = ((now - lastTickRef.current) / 1000) * speedRef.current;
        lastTickRef.current = now;
        const next = clamp(fakeTimeRef.current + delta, 0, timelineDuration);
        emitTime(next);
        if (next >= timelineDuration) {
          fakePlayingRef.current = false;
          setPlayingState(false);
          stopRaf();
          return;
        }
        rafRef.current = requestAnimationFrame(tickFake);
      },
      [emitTime, setPlayingState, stopRaf, timelineDuration]
    );

    const startFakePlayback = useCallback(() => {
      const audio = audioRef.current;
      if (audio && !audio.paused) audio.pause();
      fakePlayingRef.current = true;
      setPlayingState(true);
      stopRaf();
      rafRef.current = requestAnimationFrame(tickFake);
    }, [setPlayingState, stopRaf, tickFake]);

    const pauseAll = useCallback(() => {
      fakePlayingRef.current = false;
      stopRaf();
      const audio = audioRef.current;
      if (audio && !audio.paused) audio.pause();
      setPlayingState(false);
    }, [setPlayingState, stopRaf]);

    /**
     * Seek to an absolute transcript timestamp.
     * Always clamps to [0, timelineDuration] using start_time semantics —
     * never snaps to audio file end or meeting end_time.
     */
    const seekTo = useCallback(
      (seconds: number) => {
        const t = clamp(Number(seconds) || 0, 0, timelineDuration);
        seekingRef.current = true;
        emitTime(t);

        const audio = audioRef.current;
        const fileDur = audioFileDuration || audio?.duration || 0;

        if (audio && audioReady && Number.isFinite(fileDur) && fileDur > 0) {
          // Only drive the <audio> element while inside the real file.
          // Seeking past file length would clamp to EOF and fire `ended`
          // (which previously jumped the playhead to the full meeting end).
          if (t < fileDur - 0.05) {
            try {
              audio.currentTime = t;
            } catch {
              // ignore seek errors on unloaded media
            }
          } else {
            // Past sample audio — keep transcript timeline via fake clock.
            if (!audio.paused) audio.pause();
            if (playing || fakePlayingRef.current) {
              startFakePlayback();
            }
          }
        }

        // Clear seeking flag after audio timeupdate storm settles
        window.setTimeout(() => {
          seekingRef.current = false;
        }, 100);
      },
      [
        audioFileDuration,
        audioReady,
        emitTime,
        playing,
        startFakePlayback,
        timelineDuration,
      ]
    );

    const togglePlay = useCallback(
      async (force?: boolean) => {
        const shouldPlay = force ?? !playing;
        const audio = audioRef.current;
        const t = fakeTimeRef.current;
        const fileDur = audioFileDuration || audio?.duration || 0;
        const canUseAudio =
          !!audio &&
          audioReady &&
          Number.isFinite(fileDur) &&
          fileDur > 0 &&
          t < fileDur - 0.05;

        if (!shouldPlay) {
          pauseAll();
          return;
        }

        if (t >= timelineDuration) {
          emitTime(0);
        }

        if (!canUseAudio) {
          startFakePlayback();
          return;
        }

        try {
          fakePlayingRef.current = false;
          stopRaf();
          audio.currentTime = clamp(t, 0, fileDur - 0.05);
          await audio.play();
          setPlayingState(true);
        } catch {
          startFakePlayback();
        }
      },
      [
        audioFileDuration,
        audioReady,
        emitTime,
        pauseAll,
        playing,
        setPlayingState,
        startFakePlayback,
        stopRaf,
        timelineDuration,
      ]
    );

    useImperativeHandle(
      ref,
      () => ({
        seekTo,
        play: () => void togglePlay(true),
        pause: () => void togglePlay(false),
        toggle: () => void togglePlay(),
        skipBy: (delta) => seekTo(currentTime + delta),
        setSpeed,
      }),
      [seekTo, togglePlay, currentTime, setSpeed]
    );

    useEffect(() => {
      fakeTimeRef.current = currentTime;
    }, [currentTime]);

    useEffect(() => () => stopRaf(), [stopRaf]);

    const progress = Math.min(100, (currentTime / timelineDuration) * 100);
    const usingDemoTimer =
      !audioReady ||
      currentTime >= (audioFileDuration || 0) - 0.05 ||
      fakePlayingRef.current;

    return (
      <div className={chrome === "video" ? "" : "ff-card p-4"}>
        <audio
          ref={audioRef}
          src={src}
          preload="metadata"
          onLoadedMetadata={() => {
            const audio = audioRef.current;
            if (audio && Number.isFinite(audio.duration) && audio.duration > 0) {
              setAudioFileDuration(audio.duration);
              setAudioReady(true);
            }
          }}
          onTimeUpdate={() => {
            if (seekingRef.current || fakePlayingRef.current) return;
            const audio = audioRef.current;
            if (!audio) return;
            const fileDur = audioFileDuration || audio.duration || 0;
            if (fileDur > 0 && audio.currentTime >= fileDur - 0.05) {
              return;
            }
            emitTime(audio.currentTime);
          }}
          onPlay={() => {
            if (!fakePlayingRef.current) setPlayingState(true);
          }}
          onPause={() => {
            if (!fakePlayingRef.current) setPlayingState(false);
          }}
          onEnded={() => {
            const fileDur = audioFileDuration || audioRef.current?.duration || 0;
            const t = clamp(
              fileDur > 0 ? fileDur : fakeTimeRef.current,
              0,
              timelineDuration
            );
            emitTime(t);
            if (t < timelineDuration - 0.05) {
              startFakePlayback();
            } else {
              setPlayingState(false);
            }
          }}
          onError={() => {
            setAudioReady(false);
          }}
        />

        <div className="space-y-3">
          <div
            className={`relative aspect-video overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#312e81] ${
              chrome === "video" ? "rounded-lg" : "rounded-xl"
            }`}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/90">
              <button
                type="button"
                onClick={() => void togglePlay()}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur transition hover:bg-white/30"
                aria-label={playing ? "Pause" : "Play"}
              >
                {playing ? (
                  <Pause className="h-6 w-6 fill-current" />
                ) : (
                  <Play className="h-6 w-6 fill-current pl-0.5" />
                )}
              </button>
            </div>
            {chrome === "full" ? (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-3 pb-2 pt-8">
                <input
                  type="range"
                  min={0}
                  max={timelineDuration}
                  step={0.1}
                  value={clamp(currentTime, 0, timelineDuration)}
                  onChange={(e) => seekTo(Number(e.target.value))}
                  className="seek-range w-full cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #6C5CE7 ${progress}%, rgba(255,255,255,0.25) ${progress}%)`,
                  }}
                  aria-label="Seek"
                />
              </div>
            ) : (
              <div className="absolute bottom-2 left-3 right-3 flex items-center gap-2 text-[11px] font-medium tabular-nums text-white/80">
                <span>{formatClock(currentTime)}</span>
                <input
                  type="range"
                  min={0}
                  max={timelineDuration}
                  step={0.1}
                  value={clamp(currentTime, 0, timelineDuration)}
                  onChange={(e) => seekTo(Number(e.target.value))}
                  className="seek-range min-w-0 flex-1 cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #6C5CE7 ${progress}%, rgba(255,255,255,0.25) ${progress}%)`,
                  }}
                  aria-label="Seek"
                />
                <span>{formatClock(timelineDuration)}</span>
              </div>
            )}
          </div>

          {chrome === "full" ? (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="text-[11px] font-medium tabular-nums text-ff-gray">
              {formatClock(currentTime)} / {formatClock(timelineDuration)}
            </span>

            <div className="relative">
              <button
                type="button"
                onClick={() => setSpeedOpen((v) => !v)}
                className="rounded-md border border-ff-border px-2 py-1 text-[11px] font-semibold text-ff-text transition hover:bg-[var(--ff-input-bg)]"
              >
                {speed}x
              </button>
              {speedOpen ? (
                <div className="absolute bottom-full left-0 z-20 mb-1 min-w-[72px] overflow-hidden rounded-lg border border-ff-border bg-ff-bg py-1 shadow-lg">
                  {SPEEDS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setSpeed(s);
                        setSpeedOpen(false);
                      }}
                      className={`block w-full px-3 py-1.5 text-left text-[11px] font-medium transition hover:bg-ff-soft ${
                        speed === s ? "text-ff-purple" : "text-ff-text"
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => seekTo(currentTime - 10)}
              className="rounded-lg p-1.5 text-ff-gray transition hover:bg-[var(--ff-input-bg)] hover:text-ff-text"
              aria-label="Back 10 seconds"
              title="−10s"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => void togglePlay()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#6C5CE7] text-white shadow-sm shadow-[#6C5CE7]/30 transition hover:bg-[#5B4CDB]"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? (
                <Pause className="h-4 w-4 fill-current" />
              ) : (
                <Play className="h-4 w-4 fill-current pl-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => seekTo(currentTime + 10)}
              className="rounded-lg p-1.5 text-ff-gray transition hover:bg-[var(--ff-input-bg)] hover:text-ff-text"
              aria-label="Forward 10 seconds"
              title="+10s"
            >
              <RotateCw className="h-4 w-4" />
            </button>

            {usingDemoTimer ? (
              <span className="text-[10px] text-ff-gray-2">demo timer</span>
            ) : null}
          </div>
          ) : null}
        </div>
      </div>
    );
  }
);
