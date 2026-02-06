import { Readable } from "stream";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File;
    if (!file) return NextResponse.json({ error: "Missing file" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `editor/${Date.now()}-${safeName}`;

    const up = await supabase.storage.from("editor-images").upload(path, buffer, {
      contentType: file.type || "image/jpeg",
      upsert: true,
      cacheControl: "3600",
    });

    if (up.error) return NextResponse.json({ error: up.error.message }, { status: 500 });

    const supabaseUrl = supabase.storage.from("editor-images").getPublicUrl(path).data.publicUrl;

    // Optional Google Drive backup (only if env provided)
    let driveUrl: string | null = null;

    if (process.env.GDRIVE_SERVICE_ACCOUNT_JSON && process.env.GDRIVE_FOLDER_ID) {
      const { google } = await import("googleapis");
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GDRIVE_SERVICE_ACCOUNT_JSON),
        scopes: ["https://www.googleapis.com/auth/drive"],
      });
      const drive = google.drive({ version: "v3", auth });

      const res = await drive.files.create({
        requestBody: { name: safeName, parents: [process.env.GDRIVE_FOLDER_ID] },
        media: { mimeType: file.type, body: buffer as any },
      });

const stream = Readable.from(buffer);

const res = await drive.files.create({
  requestBody: {
    name: safeName,
    parents: [process.env.GDRIVE_FOLDER_ID!],
  },
  media: {
    mimeType: file.type || "application/octet-stream",
    body: stream,
  },
  fields: "id, name",
});
      await drive.permissions.create({
        fileId: res.data.id!,
        requestBody: { role: "reader", type: "anyone" },
      });

      driveUrl = `https://drive.google.com/file/d/${res.data.id}/view`;
    }
console.log("Drive uploaded fileId:", res.data.id);
    return NextResponse.json({ supabaseUrl, driveUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}
