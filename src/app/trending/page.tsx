"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Layout from "@/components/layout/Layout";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import PostCard from "@/components/posts/PostCard";
import { Flame, TrendingUp, Hash } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import Link from "next/link";
import { formatNumber } from "@/lib/utils";
import { useSearchParams } from "next/navigation";

type Period = "today" | "week" | "month" | "all";

interface TrendingHashtag {
  hashtag: string;
  totalScore: number;
  postCount: number;
  latestPost: any;
  rank: number;
}

function TrendingContent() {
  const { data: session } = useSession();
  const { connected, publicKey } = useWallet();
  const searchParams = useSearchParams();
  const [hashtags, setHashtags] = useState<TrendingHashtag[]>([]);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<Period>("week");
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(
    searchParams.get("hashtag")
  );
  const [hashtagPosts, setHashtagPosts] = useState<any[]>([]);

  // Sync selectedHashtag with URL params on mount
  useEffect(() => {
    const hashtagParam = searchParams.get("hashtag");
    if (hashtagParam) {
      setSelectedHashtag(hashtagParam);
    }
  }, [searchParams]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/trending?period=${period}`);
      if (res.ok) {
        const data = await res.json();
        setHashtags(data.hashtags || []);
      }
    } catch (e) {
      console.error("Failed to load trending", e);
    } finally {
      setLoading(false);
    }
  }, [period]);

  const loadHashtagPosts = useCallback(async (hashtag: string) => {
    try {
      const res = await fetch(`/api/posts?hashtag=${encodeURIComponent(hashtag)}`);
      if (res.ok) {
        const data = await res.json();
        setHashtagPosts(data.posts || []);
      }
    } catch (e) {
      console.error("Failed to load hashtag posts", e);
    }
  }, []);

  useEffect(() => { 
    load(); 
    // Auto-refresh every 30 seconds
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    if (selectedHashtag) {
      loadHashtagPosts(selectedHashtag);
    } else {
      setHashtagPosts([]);
    }
  }, [selectedHashtag, loadHashtagPosts]);

  const getPeriodLabel = (p: Period) => {
    switch (p) {
      case "today": return "Today";
      case "week": return "This Week";
      case "month": return "This Month";
      case "all": return "All Time";
    }
  };

  return (
    <Layout user={session?.user ? {
      id: (session.user as any).id,
      username: (session.user as any).username || "",
      isVerified: (session.user as any).isVerified || false,
      walletAddress: connected && publicKey ? publicKey.toString() : undefined,
    } : connected && publicKey ? {
      id: "",
      username: "",
      isVerified: false,
      walletAddress: publicKey.toString(),
    } : null}>
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl font-bold">Trending Hashtags</h2>
          </div>
          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            {loading ? "Loading…" : "Refresh"}
          </Button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {(["today", "week", "month", "all"] as Period[]).map((p) => (
            <Button
              key={p}
              size="sm"
              variant={period === p ? "default" : "outline"}
              onClick={() => setPeriod(p)}
              className="whitespace-nowrap"
            >
              {getPeriodLabel(p)}
            </Button>
          ))}
        </div>

        {selectedHashtag ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedHashtag(null);
                  window.history.pushState({}, "", "/trending");
                }}
              >
                ← Back to Trending
              </Button>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Hash className="w-5 h-5" />
                {selectedHashtag}
              </h3>
            </div>
            <div className="space-y-4">
              {hashtagPosts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No posts with {selectedHashtag} yet.
                </p>
              ) : (
                hashtagPosts.map((p) => (
                  <PostCard
                    key={p.id}
                    post={p}
                    onLike={async () => { await loadHashtagPosts(selectedHashtag); }}
                    onRepost={async () => { await loadHashtagPosts(selectedHashtag); }}
                    onComment={() => {}}
                    onTip={() => {}}
                  />
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {hashtags.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">
                  No trending hashtags for {getPeriodLabel(period).toLowerCase()} yet.
                  <br />
                  <span className="text-xs">Start using hashtags like #degens #crypto #solana in your posts!</span>
                </p>
              </div>
            ) : (
              hashtags.map((tag, idx) => (
                <div
                  key={tag.hashtag}
                  className="relative p-4 bg-card border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedHashtag(tag.hashtag);
                    window.history.pushState({}, "", `/trending?hashtag=${encodeURIComponent(tag.hashtag)}`);
                  }}
                >
                  {idx < 3 && (
                    <div className="absolute left-2 top-4 z-10">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                        idx === 0 ? "bg-gradient-to-br from-yellow-400 to-orange-500" :
                        idx === 1 ? "bg-gradient-to-br from-gray-300 to-gray-400" :
                        "bg-gradient-to-br from-amber-600 to-amber-700"
                      }`}>
                        <span className="text-white font-bold text-sm">#{idx + 1}</span>
                      </div>
                    </div>
                  )}
                  <div className={`${idx < 3 ? "ml-12" : ""} flex items-center justify-between`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Hash className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-bold">{tag.hashtag}</h3>
                        {tag.totalScore > 50 && (
                          <div className="flex items-center gap-1 bg-orange-500/20 text-orange-500 px-2 py-0.5 rounded-full text-xs font-semibold">
                            <Flame className="w-3 h-3" />
                            Hot
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{formatNumber(tag.postCount)} posts</span>
                        <span>•</span>
                        <span>Trending score: {Math.round(tag.totalScore)}</span>
                        <span>•</span>
                        <span>Rank #{tag.rank}</span>
                      </div>
                      {tag.latestPost && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <p className="text-sm text-muted-foreground mb-1">
                            Latest: {tag.latestPost.user.username}
                          </p>
                          <p className="text-sm line-clamp-2">{tag.latestPost.content.substring(0, 100)}...</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default function TrendingPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto p-4">Loading...</div>}>
      <TrendingContent />
    </Suspense>
  );
}

