import { supabase } from "@/lib/supabaseClient";

export async function listEditorImages(limit = 40) {
  const { data, error } = await supabase.storage
    .from("editor-images")
    .list("editor", { limit, sortBy: { column: "created_at", order: "desc" } });

  if (error) throw error;

  return (data ?? []).map((f) =>
    supabase.storage.from("editor-images").getPublicUrl(`editor/${f.name}`).data.publicUrl
  );
}
