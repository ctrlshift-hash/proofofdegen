import Link from "next/link";
import { NEWS_ARTICLES } from "@/lib/news";
import Layout from "@/components/layout/Layout";
import WhoToFollow from "@/components/sidebar/WhoToFollow";

export default function NewsPage() {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h1 className="text-2xl font-bold mb-4">Today's News</h1>
            <div className="space-y-4">
              {NEWS_ARTICLES.map((article) => (
                <Link
                  key={article.slug}
                  href={`/news/${article.slug}`}
                  className="block rounded-lg border border-border bg-card hover:bg-accent transition-colors"
                >
                  <div className="p-4">
                    <div className="text-sm text-muted-foreground">
                      {new Date(article.publishedAt).toLocaleString()}
                      {article.source ? ` • ${article.source}` : ""}
                    </div>
                    <h2 className="text-lg font-semibold mt-1">{article.title}</h2>
                    <p className="text-sm text-muted-foreground mt-2">
                      {article.summary}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          <div className="lg:col-span-1">
            <WhoToFollow />
          </div>
        </div>
      </div>
    </Layout>
  );
}


