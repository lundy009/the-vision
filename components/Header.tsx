"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Header() {
  const [q, setQ] = useState("");
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
        <Link href="/" className="font-bold text-lg">
          The Vision
        </Link>

        <form
          className="ml-auto flex items-center gap-2 w-full max-w-md"
          onSubmit={(e) => {
            e.preventDefault();
            router.push(`/search?q=${encodeURIComponent(q)}`);
          }}
        >
          <div className="flex items-center gap-2 w-full border rounded-full px-3 py-2">
            <Search size={18} className="opacity-60" />
            <input
              className="w-full outline-none text-sm"
              placeholder="ស្វែងរក..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </form>

        <Link
          href="/admin"
          className="text-sm px-3 py-2 rounded-full border hover:bg-gray-50"
        >
          Admin
        </Link>
      </div>
    </header>
  );
}
