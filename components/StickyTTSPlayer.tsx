"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Part = { part: number; url: string };

export default function StickyTTSPlayer({ title, parts }: { title: string; parts: Part[] }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [open, setOpen] = useState(true);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);

  const current = useMemo(() => parts?.[idx], [parts, idx]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    const onTime = () => setTime(a.currentTime || 0);
    const onDur = () => setDur(a.duration || 0);
    const onEnded = () => {
      if (idx < parts.length - 1) setIdx((p) => p + 1);
      else setPlaying(false);
    };

    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onDur);
    a.addEventListener("ended", onEnded);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onDur);
      a.removeEventListener("ended", onEnded);
    };
  }, [idx, parts.length]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.load();
    if (playing) a.play().catch(() => setPlaying(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  if (!parts?.length || !open) return null;

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <div className="fixed bottom-3 left-3 right-3 z-50">
      <div className="max-w-3xl mx-auto bg-white border rounded-2xl shadow-lg p-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              const a = audioRef.current;
              if (!a) return;
              if (playing) a.pause();
              else a.play().catch(() => setPlaying(false));
            }}
            className="px-4 py-2 rounded-xl bg-black text-white"
          >
            {playing ? "Pause" : "Play"}
          </button>

          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate">{title}</div>
            <div className="text-xs opacity-70">
              Part {idx + 1}/{parts.length} • {fmt(time)} / {fmt(dur || 0)}
            </div>
          </div>

          <button type="button" onClick={() => setOpen(false)} className="px-3 py-2 rounded-xl border">
            ✕
          </button>
        </div>

        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            disabled={idx === 0}
            onClick={() => setIdx((p) => Math.max(0, p - 1))}
            className="px-3 py-2 rounded-xl border disabled:opacity-40"
          >
            ◀
          </button>

          <input
            type="range"
            className="w-full"
            min={0}
            max={dur || 0}
            value={Math.min(time, dur || 0)}
            onChange={(e) => {
              const a = audioRef.current;
              if (!a) return;
              a.currentTime = Number(e.target.value);
              setTime(a.currentTime);
            }}
          />

          <button
            type="button"
            disabled={idx >= parts.length - 1}
            onClick={() => setIdx((p) => Math.min(parts.length - 1, p + 1))}
            className="px-3 py-2 rounded-xl border disabled:opacity-40"
          >
            ▶
          </button>
        </div>

        <audio
          ref={audioRef}
          src={current?.url}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
      </div>
    </div>
  );
}
