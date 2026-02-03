"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { slugify } from "@/lib/slug";
import { useRouter } from "next/navigation";
import RichEditor from "@/components/RichEditor";

type Category = { id: string; name: string; slug: string };

export default function NewArticlePage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("<p>សរសេរអត្ថបទនៅទីនេះ...</p>");
  const [categoryId, setCategoryId] = useState<string>("");
  const [authorName, setAuthorName] = useState("Admin");
  const [status, setStatus] = useState<"draft" | "published">("draft");

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverUrl, setCoverUrl] = useState<string>("");

  const [saving, setSaving] = useState(false);

  const autoSlug = useMemo(() => slugify(title), [title]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push("/admin");
      setUser(data.user ?? null);
    });
  }, [router]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("categories").select("id,name,slug").order("sort_order");
      setCategories((data ?? []) as any);
      const firstReal = (data ?? []).find((c: any) => c.slug !== "all");
      if (firstReal?.id) setCategoryId(firstReal.id);
    })();
  }, []);

  useEffect(() => {
    if (!slug) setSlug(autoSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSlug]);

  async function uploadCoverIfNeeded(): Promise<string> {
    if (!coverFile) return coverUrl;

    const ext = coverFile.name.split(".").pop() || "jpg";
    const filePath = `covers/${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;

    const up = await supabase.storage.from("covers").upload(filePath, coverFile, {
      cacheControl: "3600",
      upsert: false,
    });

    if (up.error) throw up.error;
    return supabase.storage.from("covers").getPublicUrl(filePath).data.publicUrl;
  }

  async function createArticle() {
    if (!title.trim()) return alert("សូមបញ្ចូល Title");
    if (!slug.trim()) return alert("សូមបញ្ចូល Slug");
    if (!content.trim()) return alert("សូមបញ្ចូល Content");

    setSaving(true);
    try {
      const finalCover = await uploadCoverIfNeeded();
      const published_at = status === "published" ? new Date().toISOString() : null;

      const { data: created, error } = await supabase
        .from("articles")
        .insert({
          title: title.trim(),
          slug: slug.trim(),
          excerpt: excerpt.trim() || null,
          content,
          cover_url: finalCover || null,
          category_id: categoryId || null,
          author_name: authorName.trim() || "Admin",
          status,
          published_at,
        })
        .select("id")
        .single();

      if (error) throw error;

      // Auto-generate TTS when published
      if (status === "published" && created?.id) {
        await fetch("/api/tts/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ articleId: created.id, voice: "onyx" }),
        });
      }

      alert("បានរក្សាទុក!");
      router.push("/admin");
    } catch (e: any) {
      alert(e?.message ?? "Error");
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  return (
    <main className="max-w-3xl mx-auto px-4 py-6">
      <div className="font-bold text-xl">New Article</div>

      <div className="mt-4 space-y-3">
        <input className="w-full border rounded-lg p-3" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="text-xs opacity-70 mb-1">Slug (auto)</div>
            <input className="w-full border rounded-lg p-3" placeholder="slug" value={slug} onChange={(e) => setSlug(slugify(e.target.value))} />
          </div>
          <div>
            <div className="text-xs opacity-70 mb-1">Status</div>
            <select className="w-full border rounded-lg p-3" value={status} onChange={(e) => setStatus(e.target.value as any)}>
              <option value="draft">draft</option>
              <option value="published">published</option>
            </select>
          </div>
        </div>

        <textarea className="w-full border rounded-lg p-3" placeholder="Excerpt" rows={3} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="text-xs opacity-70 mb-1">Category</div>
            <select className="w-full border rounded-lg p-3" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {categories.filter((c) => c.slug !== "all").map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <div className="text-xs opacity-70 mb-1">Author</div>
            <input className="w-full border rounded-lg p-3" placeholder="Author name" value={authorName} onChange={(e) => setAuthorName(e.target.value)} />
          </div>
        </div>

        <div className="border rounded-xl p-3">
          <div className="text-xs opacity-70 mb-2">Cover Image</div>
          <input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)} />
          {coverUrl ? <div className="mt-2 text-xs break-all opacity-70">{coverUrl}</div> : null}
        </div>

        <div className="border rounded-xl p-3">
          <div className="text-xs opacity-70 mb-2">Content</div>
          <RichEditor value={content} onChange={setContent} />
        </div>

        <button onClick={createArticle} disabled={saving} className="w-full rounded-lg p-3 bg-black text-white disabled:opacity-60">
          {saving ? "Saving..." : "Create"}
        </button>
      </div>
    </main>
  );
}
