"use client";

import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import CreatePost from "@/components/posts/CreatePost";
import PostCard from "@/components/posts/PostCard";
import { Button } from "@/components/ui/Button";
import { Loader2, RefreshCw } from "lucide-react";

// Mock data for development
const mockPosts = [
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
  const [posts, setPosts] = useState(mockPosts);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock user for development
  const user = {
    id: "current-user",
    username: "degenuser",
    walletAddress: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
    isVerified: true,
  };

  const handleCreatePost = async (content: string, imageUrl?: string) => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newPost = {
        id: Date.now().toString(),
        content,
        imageUrl,
        likesCount: 0,
        repostsCount: 0,
        commentsCount: 0,
        createdAt: new Date(),
        user: {
          id: user.id,
          username: user.username,
          walletAddress: user.walletAddress,
          isVerified: user.isVerified,
          profileImage: undefined,
        },
        isLiked: false,
        isReposted: false,
      };
      
      setPosts(prev => [newPost, ...prev]);
    } catch (error) {
      console.error("Failed to create post:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (postId: string) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          isLiked: !post.isLiked,
          likesCount: post.isLiked ? post.likesCount - 1 : post.likesCount + 1,
        };
      }
      return post;
    }));
  };

  const handleRepost = async (postId: string) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          isReposted: !post.isReposted,
          repostsCount: post.isReposted ? post.repostsCount - 1 : post.repostsCount + 1,
        };
      }
      return post;
    }));
  };

  const handleComment = (postId: string) => {
    console.log("Comment on post:", postId);
    // TODO: Implement comment functionality
  };

  const handleTip = (postId: string) => {
    console.log("Tip post:", postId);
    // TODO: Implement tipping functionality
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // In real app, fetch fresh posts from API
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout user={user}>
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
          {posts.length === 0 ? (
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
              />
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}