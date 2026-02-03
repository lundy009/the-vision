"use client";

import { useEffect, useState } from "react";
import { listEditorImages } from "@/lib/listEditorImages";

export default function ImageGalleryModal({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}) {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      try {
        const urls = await listEditorImages(60);
        setImages(urls);
      } finally {
        setLoading(false);
      }
    })();
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl p-4">
        <div className="flex items-center mb-3">
          <div className="font-bold">Image Gallery</div>
          <button onClick={onClose} className="ml-auto px-3 py-1 border rounded-lg">
            Close
          </button>
        </div>

        {loading ? (
          <div className="text-sm opacity-70">Loading...</div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3 max-h-[60vh] overflow-auto">
            {images.map((url) => (
              <button
                type="button"
                key={url}
                onClick={() => {
                  onSelect(url);
                  onClose();
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="rounded-xl hover:ring-2 ring-black" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
