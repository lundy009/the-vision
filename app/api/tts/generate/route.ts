import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { htmlToText } from "@/lib/htmlToText";
import { splitText } from "@/lib/splitText";
import crypto from "crypto";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

function hashText(text: string) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

export async function POST(req: NextRequest) {
  const { articleId, voice } = await req.json();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: a, error: e1 } = await supabase
    .from("articles")
    .select("id,slug,title,excerpt,content,status,tts_hash")
    .eq("id", articleId)
    .single();

  if (e1 || !a) return NextResponse.json({ error: "Article not found" }, { status: 404 });
  if (a.status !== "published") return NextResponse.json({ error: "Publish before generating TTS" }, { status: 400 });

  const body = htmlToText(a.content || "");
  const khText =
    `ចំណងជើង: ${a.title}\n\n` +
    (a.excerpt ? `សេចក្តីសង្ខេប: ${a.excerpt}\n\n` : "") +
    body;

  const newHash = hashText(khText);
  if (a.tts_hash && a.tts_hash === newHash) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const chunks = splitText(khText, 3500);
  const chosenVoice = voice || "onyx";

  const uploadedParts: { part: number; url: string }[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const speech = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: chosenVoice,
      input: chunks[i],
      response_format: "mp3",
    });

    const buffer = Buffer.from(await speech.arrayBuffer());
    const path = `articles/${a.slug}/tts-part-${String(i + 1).padStart(2, "0")}.mp3`;

    const up = await supabase.storage.from("tts").upload(path, buffer, {
      contentType: "audio/mpeg",
      upsert: true,
      cacheControl: "3600",
    });

    if (up.error) return NextResponse.json({ error: up.error.message }, { status: 500 });

    const pub = supabase.storage.from("tts").getPublicUrl(path);
    uploadedParts.push({ part: i + 1, url: pub.data.publicUrl });
  }

  const { error: e2 } = await supabase
    .from("articles")
    .update({
      tts_parts: uploadedParts,
      tts_voice: chosenVoice,
      tts_hash: newHash,
      tts_updated_at: new Date().toISOString(),
    })
    .eq("id", a.id);

  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });

  return NextResponse.json({ ok: true, parts: uploadedParts });
}
