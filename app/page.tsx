"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import ArticleCard from "@/components/ArticleCard";
import CategoryTabs from "@/components/CategoryTabs";
import HeroSlider from "@/components/HeroSlider";
import TrendingTabs from "@/components/Trending";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

const PAGE_SIZE = 10;

export default function HomePage() {
  const [latest, setLatest] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [categories, setCategories] = useState<any[]>([]);
  const [featured, setFeatured] = useState<any[]>([]);
  const [trending24h, setTrending24h] = useState<any[]>([]);
  const [trending7d, setTrending7d] = useState<any[]>([]);
  const [trending30d, setTrending30d] = useState<any[]>([]);

  useEffect(() => {
    init();
    // eslint-disable-next-line
  }, []);

  async function init() {
    const [{ data: cats }, { data: feat }, t24, t7, t30] = await Promise.all([
      supabase.from("categories").select("*").order("sort_order"),
      supabase
        .from("articles")
        .select("title,slug,cover_url,author_name,published_at")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(5),
      supabase.rpc("get_trending_24h", { p_limit: 8 }),
      supabase.rpc("get_trending_7d", { p_limit: 8 }),
      supabase.rpc("get_trending_30d", { p_limit: 8 }),
    ]);

    setCategories(cats ?? []);
    setFeatured(feat ?? []);
    setTrending24h(t24.data ?? []);
    setTrending7d(t7.data ?? []);
    setTrending30d(t30.data ?? []);

    await loadMore(); // first page
  }

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data } = await supabase
      .from("articles")
      .select("title,slug,excerpt,cover_url,author_name,published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .range(from, to);

    if (!data || data.length < PAGE_SIZE) setHasMore(false);

    setLatest((prev) => [...prev, ...(data ?? [])]);
    setPage((p) => p + 1);
    setLoading(false);
  }, [page, loading, hasMore]);

  const sentinelRef = useInfiniteScroll(loadMore, hasMore, loading);

  return (
    <main>
      <HeroSlider items={featured} />
      <CategoryTabs categories={categories} />

      <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="font-bold text-lg py-2">អត្ថបទថ្មីៗ</div>

          {latest.map((a) => (
            <ArticleCard key={a.slug} a={a} />
          ))}

          {hasMore && (
            <div ref={sentinelRef} className="py-6 text-center opacity-70">
              {loading ? "Loading..." : "Scroll to load more"}
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-20">
            <TrendingTabs
              trending24h={trending24h}
              trending7d={trending7d}
              trending30d={trending30d}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
