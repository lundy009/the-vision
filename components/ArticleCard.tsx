import Link from "next/link";

export default function ArticleCard({ a }: { a: any }) {
  return (
    <Link href={`/post/${a.slug}`} className="block">
      <div className="flex gap-3 border-b py-4">
        <div className="w-28 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0">
          {a.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={a.cover_url} alt="" className="w-full h-full object-cover" />
          ) : null}
        </div>
        <div className="flex-1">
          <div className="text-[13px] opacity-70">
            {a.author_name ?? "Admin"} •{" "}
            {a.published_at ? new Date(a.published_at).toLocaleDateString() : ""}
          </div>
          <div className="font-semibold leading-snug mt-1">{a.title}</div>
          {a.excerpt ? (
            <div className="text-sm opacity-80 line-clamp-2 mt-1">{a.excerpt}</div>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
