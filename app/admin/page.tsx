"use client";

import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<any>(null);
  const [articles, setArticles] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  async function load() {
    const { data } = await supabase
      .from("articles")
      .select("id,title,slug,status,created_at,published_at")
      .order("created_at", { ascending: false })
      .limit(50);
    setArticles(data ?? []);
  }

  useEffect(() => {
    if (user) load();
  }, [user]);

  async function signIn() {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setArticles([]);
  }

  if (!user) {
    return (
      <main className="max-w-md mx-auto px-4 py-8">
        <div className="font-bold text-xl">Admin Login</div>
        <div className="mt-4 space-y-3">
          <input className="w-full border rounded-lg p-3" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="w-full border rounded-lg p-3" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button onClick={signIn} className="w-full rounded-lg p-3 bg-black text-white">Login</button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3">
        <div className="font-bold text-xl">Admin</div>
        <Link href="/admin/articles/new" className="ml-auto px-4 py-2 rounded-lg bg-black text-white">
          + New Article
        </Link>
        <button onClick={signOut} className="px-4 py-2 rounded-lg border">Logout</button>
      </div>

      <div className="mt-4 border rounded-xl overflow-hidden">
        {articles.map((a) => (
          <div key={a.id} className="flex items-center gap-3 p-3 border-b">
            <div className="flex-1">
              <div className="font-semibold">{a.title}</div>
              <div className="text-xs opacity-70">{a.status} • {new Date(a.created_at).toLocaleString()}</div>
            </div>
            <Link className="px-3 py-2 rounded-lg border" href={`/admin/articles/${a.id}/edit`}>Edit</Link>
          </div>
        ))}
      </div>
    </main>
  );
}
