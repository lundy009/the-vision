import ArticleCard from "@/components/ArticleCard";
import { supabase } from "@/lib/supabaseClient";

export const revalidate = 0;

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams.q ?? "").trim();
  const { data } = await supabase
    .from("articles")
    .select("title,slug,excerpt,cover_url,author_name,published_at")
    .eq("status", "published")
    .ilike("title", `%${q}%`)
    .order("published_at", { ascending: false })
    .limit(30);

  return (
    <main className="max-w-5xl mx-auto px-4 py-4">
      <div className="font-bold text-xl">ស្វែងរក: {q || "-"}</div>
      <div className="mt-2">
        {(data ?? []).map((a) => (
          <ArticleCard key={a.slug} a={a} />
        ))}
      </div>
    </main>
  );
}
