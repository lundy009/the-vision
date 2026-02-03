import { supabase } from "@/lib/supabaseClient";
import { supabaseAdmin } from "@/lib/supabaseServer";
import StickyTTSPlayer from "@/components/StickyTTSPlayer";

export const revalidate = 30;

export default async function PostPage({ params }: { params: { slug: string } }) {
  const { data: a } = await supabase
    .from("articles")
    .select("*")
    .eq("status", "published")
    .eq("slug", params.slug)
    .single();

  if (!a) return <div className="max-w-5xl mx-auto px-4 py-10">Not found</div>;

  // All-time views + 7d logs
  await supabaseAdmin.from("articles").update({ views: (a.views ?? 0) + 1 }).eq("id", a.id);
  await supabaseAdmin.from("article_views").insert({ article_id: a.id });

  return (
    <main className="max-w-3xl mx-auto px-4 py-6">
      <div className="text-sm opacity-70">
        {a.author_name} • {a.published_at ? new Date(a.published_at).toLocaleString() : ""}
      </div>

      <h1 className="text-2xl font-extrabold mt-2 leading-snug">{a.title}</h1>

      {a.cover_url ? (
        <div className="mt-4 rounded-2xl overflow-hidden bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={a.cover_url} alt="" className="w-full h-auto" />
        </div>
      ) : null}

      {a.excerpt ? <div className="mt-4 text-lg opacity-90">{a.excerpt}</div> : null}

      <article className="prose prose-lg max-w-none mt-6" dangerouslySetInnerHTML={{ __html: a.content }} />

      {Array.isArray(a.tts_parts) && a.tts_parts.length > 0 ? (
        <StickyTTSPlayer title={a.title} parts={a.tts_parts} />
      ) : null}
    </main>
  );
}
