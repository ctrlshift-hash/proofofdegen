"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Layout from "@/components/layout/Layout";
import PostCard from "@/components/posts/PostCard";
import { Button } from "@/components/ui/Button";
import { 
  User, 
  Calendar, 
  Wallet, 
  CheckCircle, 
  MessageCircle,
  Heart,
  Repeat2,
  Settings
} from "lucide-react";
import { formatTimeAgo, formatNumber } from "@/lib/utils";

// Mock user data
const mockUser = {
  id: "user1",
  username: "cryptodegen",
  bio: "Crypto enthusiast and DeFi degen. Building the future of finance on Solana 🚀",
  walletAddress: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
  isVerified: true,
  profileImage: undefined,
  createdAt: new Date("2023-01-15"),
  followersCount: 1234,
  followingCount: 567,
  postsCount: 89,
  portfolioValue: 12.5, // SOL
};

// Mock posts for this user
const mockUserPosts = [
  {
    id: "1",
    content: "Just discovered this amazing new DeFi protocol! $SOL is pumping hard today 🚀",
    imageUrl: undefined,
    likesCount: 42,
    repostsCount: 12,
    commentsCount: 8,
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
    user: mockUser,
    isLiked: false,
    isReposted: false,
  },
  {
    id: "2",
    content: "The Solana ecosystem is absolutely incredible. So many innovative projects! $RAY $JUP $ORCA",
    imageUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=500&h=300&fit=crop",
    likesCount: 156,
    repostsCount: 34,
    commentsCount: 23,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    user: mockUser,
    isLiked: true,
    isReposted: false,
  },
];

export default function ProfilePage() {
  const params = useParams();
  const [user, setUser] = useState(mockUser);
  const [posts, setPosts] = useState(mockUserPosts);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
  };

  const handleTip = (postId: string) => {
    console.log("Tip post:", postId);
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    // TODO: Implement follow/unfollow functionality
  };

  return (
    <Layout user={user}>
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row md:items-start space-y-4 md:space-y-0 md:space-x-6">
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              <div className="h-24 w-24 rounded-full bg-gradient-to-r from-degen-purple to-degen-pink flex items-center justify-center">
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.username}
                    className="h-24 w-24 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-2xl">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <h1 className="text-2xl font-bold">{user.username}</h1>
                    {user.isVerified && (
                      <CheckCircle className="h-6 w-6 text-blue-500" />
                    )}
                  </div>
                  
                  {user.walletAddress && (
                    <div className="flex items-center space-x-2 text-muted-foreground mb-2">
                      <Wallet className="h-4 w-4" />
                      <span className="font-mono text-sm">
                        {user.walletAddress.slice(0, 8)}...{user.walletAddress.slice(-8)}
                      </span>
                    </div>
                  )}

                  <p className="text-foreground mb-4">{user.bio}</p>

                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Joined {user.createdAt.toLocaleDateString()}</span>
                    </div>
                    {user.portfolioValue && (
                      <div className="flex items-center space-x-1">
                        <span className="text-degen-purple font-medium">
                          {user.portfolioValue} SOL
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                  <Button
                    onClick={handleFollow}
                    variant={isFollowing ? "outline" : "default"}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </Button>
                  <Button variant="outline" size="sm">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center space-x-6 mt-6 pt-6 border-t border-border">
                <div className="text-center">
                  <div className="text-2xl font-bold">{formatNumber(user.postsCount)}</div>
                  <div className="text-sm text-muted-foreground">Posts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{formatNumber(user.followersCount)}</div>
                  <div className="text-sm text-muted-foreground">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{formatNumber(user.followingCount)}</div>
                  <div className="text-sm text-muted-foreground">Following</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Posts */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Posts</h2>
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No posts yet</p>
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

