"use client";

import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import PostCard from "@/components/posts/PostCard";

export default function TrendingPage() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/trending");
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (e) {
      console.error("Failed to load trending", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <Layout user={session?.user ? {
      id: (session.user as any).id,
      username: (session.user as any).username || "",
      isVerified: (session.user as any).isVerified || false,
    } : null}>
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Trending</h2>
          <Button size="sm" variant="outline" onClick={load} disabled={loading}>{loading ? "Loading…" : "Refresh"}</Button>
        </div>
        <div className="space-y-4">
          {posts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No trending posts yet.</p>
          ) : posts.map(p => (
            <PostCard key={p.id} post={p} onLike={() => {}} onRepost={() => {}} onComment={() => {}} onTip={() => {}} />
          ))}
        </div>
      </div>
    </Layout>
  );
}

