"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { slugify } from "@/lib/slug";
import { useParams, useRouter } from "next/navigation";
import RichEditor from "@/components/RichEditor";

type Category = { id: string; name: string; slug: string };

export default function EditArticlePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [user, setUser] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [authorName, setAuthorName] = useState("Admin");
  const [status, setStatus] = useState<"draft" | "published">("draft");

  const [originalStatus, setOriginalStatus] = useState<"draft" | "published">("draft");
  const [originalContent, setOriginalContent] = useState<string>("");
  const [originalTitle, setOriginalTitle] = useState<string>("");
  const [originalExcerpt, setOriginalExcerpt] = useState<string>("");

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverUrl, setCoverUrl] = useState<string>("");

  const [saving, setSaving] = useState(false);
  const [ttsBusy, setTtsBusy] = useState(false);
  const [loading, setLoading] = useState(true);

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
    })();
  }, []);

  useEffect(() => {
    if (!id) return;

    (async () => {
      setLoading(true);
      const { data, error } = await supabase.from("articles").select("*").eq("id", id).single();
      if (error || !data) {
        alert(error?.message ?? "Not found");
        router.push("/admin");
        return;
      }
      setTitle(data.title ?? "");
      setSlug(data.slug ?? "");
      setExcerpt(data.excerpt ?? "");
      setContent(data.content ?? "");
      setCoverUrl(data.cover_url ?? "");
      setCategoryId(data.category_id ?? "");
      setAuthorName(data.author_name ?? "Admin");
      setStatus((data.status ?? "draft") as any);

      setOriginalStatus((data.status ?? "draft") as any);
      setOriginalContent(data.content ?? "");
      setOriginalTitle(data.title ?? "");
      setOriginalExcerpt(data.excerpt ?? "");

      setLoading(false);
    })();
  }, [id, router]);

  useEffect(() => {
    if (!slug) setSlug(autoSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSlug]);

  async function uploadCoverIfNeeded(): Promise<string> {
    if (!coverFile) return coverUrl;

    const ext = coverFile.name.split(".").pop() || "jpg";
    const filePath = `covers/${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;

    const up = await supabase.storage.from("covers").upload(filePath, coverFile, { cacheControl: "3600", upsert: false });
    if (up.error) throw up.error;

    return supabase.storage.from("covers").getPublicUrl(filePath).data.publicUrl;
  }

  async function save() {
    if (!title.trim()) return alert("សូមបញ្ចូល Title");
    if (!slug.trim()) return alert("សូមបញ្ចូល Slug");

    setSaving(true);
    try {
      const finalCover = await uploadCoverIfNeeded();
      const published_at = status === "published" ? new Date().toISOString() : null;

      const { error } = await supabase
        .from("articles")
        .update({
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
        .eq("id", id);

      if (error) throw error;

      // Auto TTS: publish OR regen when published and content changed
      const contentChanged =
        originalContent !== content || originalTitle !== title || originalExcerpt !== excerpt;

      const shouldRegen =
        status === "published" &&
        ((originalStatus !== "published" && status === "published") ||
          (originalStatus === "published" && contentChanged));

      if (shouldRegen) {
        setTtsBusy(true);
        try {
          const r = await fetch("/api/tts/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ articleId: id, voice: "onyx" }),
          });
          const j = await r.json();
          if (!r.ok) throw new Error(j.error || "TTS failed");
        } catch (e: any) {
          alert("Save បានហើយ ប៉ុន្តែ TTS error: " + (e.message || ""));
        } finally {
          setTtsBusy(false);
        }
      }

      setOriginalContent(content);
      setOriginalTitle(title);
      setOriginalExcerpt(excerpt);
      setOriginalStatus(status);

      alert("បាន update!");
      router.push("/admin");
    } catch (e: any) {
      alert(e?.message ?? "Error");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    const ok = confirm("Delete this article?");
    if (!ok) return;

    setSaving(true);
    try {
      const { error } = await supabase.from("articles").delete().eq("id", id);
      if (error) throw error;

      alert("Deleted!");
      router.push("/admin");
    } catch (e: any) {
      alert(e?.message ?? "Error");
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;
  if (loading) return <div className="max-w-3xl mx-auto px-4 py-10">Loading...</div>;

  return (
    <main className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3">
        <div className="font-bold text-xl">Edit Article</div>
        <button onClick={remove} disabled={saving} className="ml-auto px-4 py-2 rounded-lg border text-red-600">
          Delete
        </button>
      </div>

      {ttsBusy ? (
        <div className="mt-3 text-sm opacity-70">🔊 កំពុងបង្កើត/Regenerate សំលេងអានអត្ថបទ...</div>
      ) : null}

      <div className="mt-4 space-y-3">
        <input className="w-full border rounded-lg p-3" value={title} onChange={(e) => setTitle(e.target.value)} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="text-xs opacity-70 mb-1">Slug</div>
            <input className="w-full border rounded-lg p-3" value={slug} onChange={(e) => setSlug(slugify(e.target.value))} />
          </div>

          <div>
            <div className="text-xs opacity-70 mb-1">Status</div>
            <select className="w-full border rounded-lg p-3" value={status} onChange={(e) => setStatus(e.target.value as any)}>
              <option value="draft">draft</option>
              <option value="published">published</option>
            </select>
          </div>
        </div>

        <textarea className="w-full border rounded-lg p-3" rows={3} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />

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
            <input className="w-full border rounded-lg p-3" value={authorName} onChange={(e) => setAuthorName(e.target.value)} />
          </div>
        </div>

        <div className="border rounded-xl p-3">
          <div className="text-xs opacity-70 mb-2">Cover Image</div>
          <input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)} />
          {coverUrl ? (
            <div className="mt-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverUrl} alt="" className="w-full rounded-xl" />
              <div className="text-xs opacity-60 mt-2 break-all">{coverUrl}</div>
            </div>
          ) : null}
        </div>

        <div className="border rounded-xl p-3">
          <div className="text-xs opacity-70 mb-2">Content</div>
          <RichEditor value={content} onChange={setContent} />
        </div>

        <button onClick={save} disabled={saving} className="w-full rounded-lg p-3 bg-black text-white disabled:opacity-60">
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </main>
  );
}
