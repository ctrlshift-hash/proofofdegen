"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type TopPost = {
  id: string;
  content: string;
  likesCount: number;
  downvotesCount?: number;
  createdAt: string;
  user: { id: string; username: string | null; profileImage?: string | null; isVerified: boolean } | null;
};

export default function TopCoal() {
  const pathname = usePathname();
  const [posts, setPosts] = useState<TopPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Load cached posts on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem("topcoal_posts");
      if (cached) {
        const parsed = JSON.parse(cached);
        // Only use cache if it's recent (within 2 minutes)
        if (parsed.timestamp && Date.now() - parsed.timestamp < 2 * 60 * 1000) {
          setPosts(parsed.data || []);
          setLoading(false);
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/coal/top?period=today");
        if (res.ok) {
          const data = await res.json();
          const newPosts = data.posts || [];
          // Only update if we got valid data
          if (Array.isArray(newPosts)) {
            setPosts(newPosts);
            // Cache posts
            try {
              localStorage.setItem("topcoal_posts", JSON.stringify({
                data: newPosts,
                timestamp: Date.now()
              }));
            } catch {}
          }
        }
      } catch (e) {
        console.error("Failed to load top coal:", e);
      }
    };
    load();
    const interval = setInterval(load, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="border-b border-border pb-2 mb-2 font-semibold">Top Coal Today</div>
        <div className="space-y-3">
          <div className="h-4 bg-muted rounded animate-pulse" />
          <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
          <div className="h-4 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="p-4 border-b border-border font-semibold">Top Coal Today</div>
      {posts.length === 0 ? (
        <div className="p-4 text-center text-muted-foreground text-sm">
          No coal posts yet
        </div>
      ) : (
        <>
          <div className="p-2 space-y-2">
            {posts.map((p) => (
              <Link key={p.id} href="/coal-station" className="block p-2 rounded hover:bg-accent">
                <div className="text-sm line-clamp-2">{p.content}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {p.likesCount} agree • {(p.downvotesCount ?? 0)} disagree • {new Date(p.createdAt).toLocaleTimeString()}
                </div>
              </Link>
            ))}
          </div>
          {pathname !== "/coal-station" && (
            <div className="p-2 text-right">
              <Link href="/coal-station" className="pill-btn-primary inline-block text-xs">Open Coal Station</Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}


