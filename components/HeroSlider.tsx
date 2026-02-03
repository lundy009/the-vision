"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function HeroSlider({ items }: { items: any[] }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (!items?.length) return;
    const t = setInterval(() => setI((p) => (p + 1) % items.length), 3500);
    return () => clearInterval(t);
  }, [items]);

  if (!items?.length) return null;
  const a = items[i];

  return (
    <div className="max-w-5xl mx-auto px-4 pt-4">
      <Link href={`/post/${a.slug}`} className="block">
        <div className="relative rounded-2xl overflow-hidden bg-gray-100 aspect-[16/9]">
          {a.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={a.cover_url} alt="" className="w-full h-full object-cover" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute bottom-0 p-4 text-white">
            <div className="text-xs opacity-80">
              {a.author_name ?? "Admin"} •{" "}
              {a.published_at ? new Date(a.published_at).toLocaleDateString() : ""}
            </div>
            <div className="text-lg font-bold leading-snug mt-1 line-clamp-2">
              {a.title}
            </div>
          </div>
        </div>
      </Link>

      <div className="flex justify-center gap-2 py-3">
        {items.map((_: any, idx: number) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            className={`h-2 w-2 rounded-full ${idx === i ? "bg-black" : "bg-gray-300"}`}
            aria-label="dot"
          />
        ))}
      </div>
    </div>
  );
}
