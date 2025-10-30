"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Layout from "@/components/layout/Layout";
import CreatePost from "@/components/posts/CreatePost";
import PostCard from "@/components/posts/PostCard";
import { Button } from "@/components/ui/Button";
import { Loader2, RefreshCw } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";

// Type definition for posts
interface Post {
  id: string;
  content: string;
  imageUrl?: string;
  likesCount: number;
  repostsCount: number;
  commentsCount: number;
  createdAt: Date | string;
  user: {
    id: string;
    username: string;
    walletAddress?: string;
    isVerified: boolean;
    profileImage?: string;
  };
  isLiked: boolean;
  isReposted: boolean;
}

// Mock data for development
const mockPosts: Post[] = [
  {
    id: "1",
    content: "Just discovered this amazing new DeFi protocol! $SOL is pumping hard today 🚀",
    imageUrl: undefined,
    likesCount: 42,
    repostsCount: 12,
    commentsCount: 8,
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    user: {
      id: "user1",
      username: "cryptodegen",
      walletAddress: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
      isVerified: true,
      profileImage: undefined,
    },
    isLiked: false,
    isReposted: false,
  },
  {
    id: "2",
    content: "The $BONK community is absolutely insane! Love the energy here 💎🙌",
    imageUrl: undefined,
    likesCount: 156,
    repostsCount: 34,
    commentsCount: 23,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    user: {
      id: "user2",
      username: "bonkmaxxer",
      walletAddress: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      isVerified: true,
      profileImage: undefined,
    },
    isLiked: true,
    isReposted: false,
  },
  {
    id: "3",
    content: "Building something cool on Solana. The ecosystem is growing so fast! $RAY $JUP $ORCA",
    imageUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=500&h=300&fit=crop",
    likesCount: 89,
    repostsCount: 19,
    commentsCount: 15,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
    user: {
      id: "user3",
      username: "solana_builder",
      walletAddress: undefined,
      isVerified: false,
      profileImage: undefined,
    },
    isLiked: false,
    isReposted: true,
  },
];

export default function HomePage() {
  const { data: session, status } = useSession();
  const { connected, publicKey } = useWallet();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch posts from API
  const fetchPosts = async () => {
    try {
      const response = await fetch("/api/posts");
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCreatePost = async (content: string, imageUrl?: string) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content, imageUrl, walletAddress: (!session?.user && connected && publicKey) ? publicKey.toBase58() : undefined }),
      });

      if (response.ok) {
        const newPost = await response.json();
        setPosts(prev => [newPost, ...prev]);
        // Also refresh from server to ensure counts and user data are consistent
        fetchPosts();
      } else {
        const text = await response.text();
        console.error("Failed to create post:", response.status, text);
        // DEV FALLBACK: show the post locally so you can test the UI without APIs
        const now = new Date().toISOString();
        const walletAddr = (!session?.user && connected && publicKey) ? publicKey.toBase58() : undefined;
        const username = session?.user?.username || (walletAddr ? `anon_${walletAddr.slice(0,6)}` : "Anonymous");
        const localPost: Post = {
          id: `local_${Date.now()}`,
          content,
          imageUrl,
          likesCount: 0,
          repostsCount: 0,
          commentsCount: 0,
          createdAt: now,
          user: {
            id: session?.user?.id || "local",
            username,
            walletAddress: walletAddr,
            isVerified: !!walletAddr,
            profileImage: undefined,
          },
          isLiked: false,
          isReposted: false,
        };
        setPosts(prev => [localPost, ...prev]);
      }
    } catch (error) {
      console.error("Failed to create post:", error);
      // DEV FALLBACK on network error
      const now = new Date().toISOString();
      const walletAddr = (!session?.user && connected && publicKey) ? publicKey.toBase58() : undefined;
      const username = session?.user?.username || (walletAddr ? `anon_${walletAddr.slice(0,6)}` : "Anonymous");
      const localPost: Post = {
        id: `local_${Date.now()}`,
        content,
        imageUrl,
        likesCount: 0,
        repostsCount: 0,
        commentsCount: 0,
        createdAt: now,
        user: {
          id: session?.user?.id || "local",
          username,
          walletAddress: walletAddr,
          isVerified: !!walletAddr,
          profileImage: undefined,
        },
        isLiked: false,
        isReposted: false,
      };
      setPosts(prev => [localPost, ...prev]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
      });

      if (response.ok) {
        const { liked } = await response.json();
        setPosts(prev => prev.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              isLiked: liked,
              likesCount: liked ? post.likesCount + 1 : post.likesCount - 1,
            };
          }
          return post;
        }));
      }
    } catch (error) {
      console.error("Failed to toggle like:", error);
    }
  };

  const handleRepost = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/repost`, {
        method: "POST",
      });

      if (response.ok) {
        const { reposted } = await response.json();
        setPosts(prev => prev.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              isReposted: reposted,
              repostsCount: reposted ? post.repostsCount + 1 : post.repostsCount - 1,
            };
          }
          return post;
        }));
      }
    } catch (error) {
      console.error("Failed to toggle repost:", error);
    }
  };

  const handleComment = (postId: string) => {
    // Comment functionality is now handled in PostCard component
    console.log("Comment on post:", postId);
  };

  const handleTip = (postId: string) => {
    console.log("Tip post:", postId);
    // TODO: Implement tipping functionality
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await fetchPosts();
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Layout user={session?.user ? {
      id: session.user.id,
      username: session.user.username || "",
      walletAddress: undefined, // TODO: Get from wallet connection
      isVerified: session.user.isVerified || false,
    } : null}>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Create Post */}
        <CreatePost 
          onSubmit={handleCreatePost}
          isSubmitting={isSubmitting}
        />

        {/* Feed Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Home Feed</h2>
          <Button
            onClick={handleRefresh}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-2">Refresh</span>
          </Button>
        </div>

        {/* Posts Feed */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No posts yet</p>
              <p className="text-sm text-muted-foreground">
                Be the first to share something with the degen community!
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={handleLike}
                onRepost={handleRepost}
                onComment={handleComment}
                onTip={handleTip}
                onDeleted={(id) => setPosts(prev => prev.filter(p => p.id !== id))}
              />
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}