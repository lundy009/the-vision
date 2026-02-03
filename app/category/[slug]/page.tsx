"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import ArticleCard from "@/components/ArticleCard";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

const PAGE_SIZE = 10;

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();

  const [cat, setCat] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    resetAndInit();
    // eslint-disable-next-line
  }, [slug]);

  async function resetAndInit() {
    setItems([]);
    setPage(0);
    setHasMore(true);

    const { data } = await supabase.from("categories").select("*").eq("slug", slug).single();
    setCat(data);
    await loadMore(data?.id);
  }

  const loadMore = useCallback(
    async (categoryId = cat?.id) => {
      if (!categoryId || loading || !hasMore) return;
      setLoading(true);

      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data } = await supabase
        .from("articles")
        .select("title,slug,excerpt,cover_url,author_name,published_at")
        .eq("status", "published")
        .eq("category_id", categoryId)
        .order("published_at", { ascending: false })
        .range(from, to);

      if (!data || data.length < PAGE_SIZE) setHasMore(false);

      setItems((prev) => [...prev, ...(data ?? [])]);
      setPage((p) => p + 1);
      setLoading(false);
    },
    [page, loading, hasMore, cat?.id]
  );

  const sentinelRef = useInfiniteScroll(() => loadMore(), hasMore, loading);

  return (
    <main className="max-w-5xl mx-auto px-4 py-4">
      <div className="font-bold text-xl">{cat?.name}</div>

      <div className="mt-3">
        {items.map((a) => (
          <ArticleCard key={a.slug} a={a} />
        ))}
      </div>

      {hasMore && (
        <div ref={sentinelRef} className="py-6 text-center opacity-70">
          {loading ? "Loading..." : "Scroll to load more"}
        </div>
      )}
    </main>
  );
}
