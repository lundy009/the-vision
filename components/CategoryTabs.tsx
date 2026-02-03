import Link from "next/link";

export default function CategoryTabs({ categories }: { categories: any[] }) {
  return (
    <div className="max-w-5xl mx-auto px-4">
      <div className="flex gap-2 overflow-x-auto py-3 no-scrollbar">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={c.slug === "all" ? "/" : `/category/${c.slug}`}
            className="shrink-0 px-4 py-2 rounded-full border text-sm hover:bg-gray-50"
          >
            {c.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
