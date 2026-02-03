"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Mode = "24h" | "7d" | "30d";

export default function TrendingTabs({
  trending24h,
  trending7d,
  trending30d,
}: {
  trending24h: any[];
  trending7d: any[];
  trending30d: any[];
}) {
  const [mode, setMode] = useState<Mode>("7d");

  const items = useMemo(() => {
    if (mode === "24h") return trending24h ?? [];
    if (mode === "30d") return trending30d ?? [];
    return trending7d ?? [];
  }, [mode, trending24h, trending7d, trending30d]);

  const label = mode === "24h" ? "24h" : mode === "30d" ? "30d" : "7d";

  return (
    <aside className="border rounded-2xl p-4">
      <div className="flex items-center gap-2">
        <div className="font-bold text-lg">🔥 Trending</div>

        <div className="ml-auto flex gap-2">
          <Tab active={mode === "24h"} onClick={() => setMode("24h")}>24h</Tab>
          <Tab active={mode === "7d"} onClick={() => setMode("7d")}>7d</Tab>
          <Tab active={mode === "30d"} onClick={() => setMode("30d")}>30d</Tab>
        </div>
      </div>

      <div className="mt-3 space-y-3">
        {items.length === 0 ? (
          <div className="text-sm opacity-70">មិនទាន់មានទិន្នន័យ Trending ({label})។</div>
        ) : null}

        {items.map((a, idx) => {
          const views =
            mode === "24h" ? a.views_24h : mode === "30d" ? a.views_30d : a.views_7d;

          return (
            <Link key={a.slug} href={`/post/${a.slug}`} className="block">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-bold">
                  {idx + 1}
                </div>

                <div className="flex-1">
                  <div className="font-semibold leading-snug line-clamp-2">{a.title}</div>
                  <div className="text-xs opacity-70 mt-1">
                    👁 {views ?? 0} ({label}) •{" "}
                    {a.published_at ? new Date(a.published_at).toLocaleDateString() : ""}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs px-3 py-1 rounded-full border ${
        active ? "bg-black text-white border-black" : "hover:bg-gray-50"
      }`}
    >
      {children}
    </button>
  );
}
