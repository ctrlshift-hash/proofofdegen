import Link from "next/link";
import { NEWS_ARTICLES } from "@/lib/news";

export default function Stories() {
  const stories = NEWS_ARTICLES.slice(0, 2);

  return (
    <div className="mt-6 rounded-lg border border-border bg-card">
      <div className="p-4 border-b border-border font-semibold">Stories</div>
      <div className="p-2">
        {stories.map((a) => (
          <Link key={a.slug} href={`/news/${a.slug}`} className="block p-2 rounded hover:bg-accent">
            <div className="text-sm font-medium">{a.title}</div>
            <div className="text-xs text-muted-foreground truncate">
              {new Date(a.publishedAt).toLocaleString()} • {a.source || "DegenHub"}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}


