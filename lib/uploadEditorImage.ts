import { processImage } from "@/lib/processImage";

/**
 * Upload ONE time -> server uploads to Supabase + Google Drive (optional) and returns URLs.
 * Uses /api/upload-image. Progress is handled via a fake progress for UX; streaming progress
 * is not available with fetch in all browsers.
 */
export async function uploadEditorImage(
  file: File,
  onProgress?: (p: number) => void
) {
  if (file.size > 5 * 1024 * 1024) throw new Error("Image must be <= 5MB");

  // compress/resize first (client-side)
  const optimized = await processImage(file);

  // simple progress UX
  onProgress?.(10);

  const form = new FormData();
  form.append("file", optimized);

  const res = await fetch("/api/upload-image", { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Upload failed");

  onProgress?.(100);

  // return supabase public url for embedding
  return { supabaseUrl: data.supabaseUrl as string, driveUrl: data.driveUrl as string | null };
}
