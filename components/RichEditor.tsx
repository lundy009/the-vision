"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { useEffect, useState } from "react";
import { uploadEditorImage } from "@/lib/uploadEditorImage";
import ImageGalleryModal from "@/components/ImageGalleryModal";

export default function RichEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const [progress, setProgress] = useState<number | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: true, autolink: true }),
      Image.configure({ inline: false }),
    ],
    content: value || "<p></p>",
    editorProps: {
      attributes: {
        class: "prose prose-lg max-w-none focus:outline-none min-h-[240px] p-3",
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value != null && value !== current) editor.commands.setContent(value, false);
  }, [value, editor]);

  if (!editor) return null;

  const Btn = ({
    active,
    onClick,
    children,
  }: {
    active?: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 rounded-lg border text-sm hover:bg-gray-50 ${
        active ? "bg-black text-white border-black" : ""
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="border rounded-xl overflow-hidden">
      <div className="flex flex-wrap gap-2 p-2 border-b bg-white">
        <Btn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          B
        </Btn>
        <Btn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          I
        </Btn>
        <Btn active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          U
        </Btn>
        <Btn active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          H2
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleBulletList().run()}>• List</Btn>
        <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. List</Btn>
        <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()}>&quot; Quote</Btn>
        <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()}>—</Btn>

        <Btn
          onClick={() => {
            const url = prompt("Link URL");
            if (!url) return;
            editor.chain().focus().setLink({ href: url }).run();
          }}
        >
          Link
        </Btn>
        <Btn onClick={() => editor.chain().focus().unsetLink().run()}>Unlink</Btn>

        <Btn
          onClick={async () => {
            const url = prompt("Image URL");
            if (!url) return;
            editor.chain().focus().setImage({ src: url }).run();
          }}
        >
          Image URL
        </Btn>

        <input
          type="file"
          accept="image/*"
          id="editor-image-upload"
          hidden
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            try {
              setProgress(0);
              const { supabaseUrl } = await uploadEditorImage(file, setProgress);
              editor.chain().focus().setImage({ src: supabaseUrl }).run();
              // optional: you can call AI meta API here to add caption/alt
            } catch (err: any) {
              alert(err?.message ?? "Upload failed");
            } finally {
              setProgress(null);
              e.currentTarget.value = "";
            }
          }}
        />
        <Btn onClick={() => document.getElementById("editor-image-upload")?.click()}>
          Upload
        </Btn>

        <Btn onClick={() => setGalleryOpen(true)}>Gallery</Btn>

        <Btn onClick={() => editor.chain().focus().undo().run()}>Undo</Btn>
        <Btn onClick={() => editor.chain().focus().redo().run()}>Redo</Btn>
      </div>

      {progress !== null ? (
        <div className="px-3 py-2">
          <div className="w-full h-2 bg-gray-200 rounded">
            <div className="h-2 bg-black rounded" style={{ width: `${progress}%` }} />
          </div>
          <div className="text-xs opacity-70 mt-1">Uploading... {progress}%</div>
        </div>
      ) : null}

      <EditorContent editor={editor} />

      <ImageGalleryModal
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        onSelect={(url) => editor.chain().focus().setImage({ src: url }).run()}
      />
    </div>
  );
}
