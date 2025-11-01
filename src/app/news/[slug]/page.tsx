import { notFound } from "next/navigation";
import Link from "next/link";
import { getArticleBySlug, NEWS_ARTICLES } from "@/lib/news";
import Layout from "@/components/layout/Layout";
import WhoToFollow from "@/components/sidebar/WhoToFollow";

type Params = {
  params: Promise<{ slug: string }> | { slug: string };
};

export function generateStaticParams() {
  return NEWS_ARTICLES.map((a) => ({ slug: a.slug }));
}

export default async function ArticlePage({ params }: Params) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const article = getArticleBySlug(resolvedParams.slug);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 sm:p-0">
          <article className="lg:col-span-2">
            <div className="text-sm text-muted-foreground">
              <Link href="/news" className="hover:underline">
                Today's News
              </Link>
              {" "}
              <span>{new Date(article?.publishedAt || Date.now()).toLocaleString()}</span>
              {article?.source ? <span>{` • ${article.source}`}</span> : null}
            </div>

            <h1 className="text-2xl font-bold mt-2">{article?.title || "Story not found"}</h1>

            <div className="prose prose-invert max-w-none mt-4">
              {article ? (
                article.content.map((paragraph, idx) => (
                  <p key={idx} className="leading-7">
                    {paragraph}
                  </p>
                ))
              ) : (
                <p className="text-muted-foreground">
                  We couldn't find this story. Please return to {""}
                  <Link href="/news" className="underline">Today&apos;s News</Link>.
                </p>
              )}
            </div>
          </article>
          <aside className="lg:col-span-1">
            <WhoToFollow />
            <div className="mt-6 rounded-lg border border-border bg-card">
              <div className="p-4 border-b border-border font-semibold">More stories</div>
              <div className="p-2">
                {NEWS_ARTICLES.filter(a => !article || a.slug !== article.slug).map((a) => (
                  <Link key={a.slug} href={`/news/${a.slug}`} className="block p-2 rounded hover:bg-accent">
                    <div className="text-sm font-medium">{a.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{a.summary}</div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}


