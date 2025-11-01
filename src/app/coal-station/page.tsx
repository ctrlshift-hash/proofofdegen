"use client";

import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import CreatePost from "@/components/posts/CreatePost";
import PostCard from "@/components/posts/PostCard";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { useWallet } from "@/contexts/WalletContext";
import Stories from "@/components/sidebar/Stories";
import TopCoal from "@/components/sidebar/TopCoal";
import WhoToFollow from "@/components/sidebar/WhoToFollow";

export default function CoalStationPage() {
  const { data: session } = useSession();
  const { connected, publicKey } = useWallet();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/posts?hashtag=${encodeURIComponent("#coal")}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleCreate = async (content: string, imageUrls?: string[]) => {
    const payload = content.includes("#coal") ? content : `#coal ${content}`;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (!session?.user && connected && publicKey) {
      headers["X-Wallet-Address"] = publicKey.toBase58();
    }
    const res = await fetch("/api/posts", {
      method: "POST",
      headers,
      body: JSON.stringify({ content: payload, imageUrls, walletAddress: (!session?.user && connected && publicKey) ? publicKey.toBase58() : undefined }),
    });
    if (res.ok) {
      await fetchPosts();
    }
  };

  return (
    <Layout user={session?.user || (connected && publicKey ? { id: "", username: "", isVerified: false, walletAddress: publicKey.toBase58() } as any : null)}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6 pb-24">
            <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Coal Station</h1>
          <Button size="sm" onClick={fetchPosts} disabled={loading} className="pill-btn">
            {loading ? "Loading…" : "Refresh"}
          </Button>
        </div>
            {/* Dev-only clear removed on request */}
        <p className="text-sm text-muted-foreground">
          Post coins you think are overhyped or risky and explain why. Use the tag <span className="font-mono">#coal</span>.
        </p>

        <CreatePost onSubmit={handleCreate} />

            <div className="space-y-4">
              {loading ? (
                <div className="text-muted-foreground">Loading…</div>
              ) : posts.length === 0 ? (
                <div className="text-muted-foreground">No posts yet. Be the first to drop some coal.</div>
              ) : (
                posts.map((p) => (
                  <PostCard key={p.id} post={p} onLike={()=>{}} onRepost={()=>{}} onComment={()=>{}} onTip={()=>{}} onDeleted={(id)=>setPosts(prev=>prev.filter(x=>x.id!==id))} />
                ))
              )}
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-6">
              <WhoToFollow />
              <Stories />
              <TopCoal />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}


