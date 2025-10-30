"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { 
  Heart, 
  MessageCircle, 
  Repeat2, 
  Share, 
  MoreHorizontal,
  CheckCircle,
  Wallet
} from "lucide-react";
import { formatTimeAgo, formatNumber, extractTokenMentions } from "@/lib/utils";
import CommentSection from "./CommentSection";
import { useSession } from "next-auth/react";
import { useWallet } from "@/contexts/WalletContext";

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
  isLiked?: boolean;
  isReposted?: boolean;
}

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => Promise<void>;
  onRepost: (postId: string) => Promise<void>;
  onComment: (postId: string) => void;
  onTip?: (postId: string) => void;
  onDeleted?: (postId: string) => void;
}

export default function PostCard({ 
  post, 
  onLike, 
  onRepost, 
  onComment, 
  onTip,
  onDeleted
}: PostCardProps) {
  const [isLiking, setIsLiking] = useState(false);
  const [isReposting, setIsReposting] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const { data: session } = useSession();
  const { publicKey } = useWallet();
  const [copied, setCopied] = useState(false);

  const tokenMentions = extractTokenMentions(post.content);

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      await onLike(post.id);
    } finally {
      setIsLiking(false);
    }
  };

  const handleRepost = async () => {
    if (isReposting) return;
    setIsReposting(true);
    try {
      await onRepost(post.id);
    } finally {
      setIsReposting(false);
    }
  };

  const renderContent = (text: string) => {
    const parts = text.split(/(\$[A-Z]{2,10})/g);
    return parts.map((part, index) => {
      if (part.match(/^\$[A-Z]{2,10}$/)) {
        return (
          <span
            key={index}
            className="text-degen-purple font-medium hover:underline cursor-pointer"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="card hover:bg-card/50 transition-colors">
      <div className="flex space-x-3">
        {/* User Avatar */}
        <Link href={`/profile/${post.user.id}`} className="flex-shrink-0">
          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-degen-purple to-degen-pink flex items-center justify-center">
            {post.user.profileImage ? (
              <img
                src={post.user.profileImage}
                alt={post.user.username}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <span className="text-white font-medium text-sm">
                {post.user.username.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </Link>

        {/* Post Content */}
        <div className="flex-1 min-w-0">
          {/* User Info */}
          <div className="flex items-center space-x-2 mb-2">
            <Link 
              href={`/profile/${post.user.id}`}
              className="font-medium hover:underline"
            >
              {post.user.username}
            </Link>
            <button
              onClick={async () => { try { await navigator.clipboard.writeText(post.user.username); setCopied(true); setTimeout(() => setCopied(false), 1200); } catch {} }}
              className="text-xs px-2 py-0.5 rounded bg-muted hover:bg-muted/80 transition-colors"
              title="Copy username"
            >
              {copied ? "Copied" : "Copy"}
            </button>
            
            {post.user.isVerified && (
              <CheckCircle className="h-4 w-4 text-blue-500" />
            )}
            
            {post.user.walletAddress && (
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <Wallet className="h-3 w-3" />
                <span>{post.user.walletAddress.slice(0, 4)}...{post.user.walletAddress.slice(-4)}</span>
              </div>
            )}
            
            <span className="text-muted-foreground text-sm">
              · {formatTimeAgo(post.createdAt)}
            </span>

            <button
              onClick={() => setShowActions(!showActions)}
              className="ml-auto p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {showActions && (
              <div className="relative">
                <div className="absolute right-0 mt-2 bg-card border border-border rounded-md shadow p-2 text-sm">
                  <button
                    className="block w-full text-left hover:text-red-500"
                    onClick={async () => {
                      try {
                        const headers: Record<string, string> = {};
                        if (!session?.user && publicKey) headers["X-Wallet-Address"] = publicKey.toBase58();
                        const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE", headers });
                        if (res.ok) onDeleted?.(post.id);
                      } catch (e) { console.error(e); }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Post Text */}
          <div className="mb-3">
            <p className="text-foreground whitespace-pre-wrap">
              {renderContent(post.content)}
            </p>
          </div>

          {/* Token Mentions */}
          {tokenMentions.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {tokenMentions.map((token, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-degen-purple/10 text-degen-purple rounded-full text-sm font-medium"
                >
                  {token}
                </span>
              ))}
            </div>
          )}

          {/* Post Image */}
          {post.imageUrl && (
            <div className="mb-3 rounded-lg overflow-hidden">
              <img
                src={post.imageUrl}
                alt="Post image"
                className="w-full h-auto max-h-96 object-cover"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between max-w-md">
            <button
              onClick={handleLike}
              disabled={isLiking}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                post.isLiked
                  ? "text-red-500 bg-red-500/10"
                  : "text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
              }`}
            >
              <Heart className={`h-4 w-4 ${post.isLiked ? "fill-current" : ""}`} />
              <span className="text-sm font-medium">
                {formatNumber(post.likesCount)}
              </span>
            </button>

            <button
              onClick={() => setShowComments(true)}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm font-medium">
                {formatNumber(post.commentsCount)}
              </span>
            </button>

            <button
              onClick={handleRepost}
              disabled={isReposting}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                post.isReposted
                  ? "text-green-500 bg-green-500/10"
                  : "text-muted-foreground hover:text-green-500 hover:bg-green-500/10"
              }`}
            >
              <Repeat2 className={`h-4 w-4 ${post.isReposted ? "fill-current" : ""}`} />
              <span className="text-sm font-medium">
                {formatNumber(post.repostsCount)}
              </span>
            </button>

            {onTip && post.user.walletAddress && (
              <button
                onClick={() => onTip(post.id)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-muted-foreground hover:text-degen-purple hover:bg-degen-purple/10 transition-colors"
              >
                <span className="text-sm font-medium">💎</span>
                <span className="text-sm font-medium">Tip</span>
              </button>
            )}

            <button className="flex items-center space-x-2 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
              <Share className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Comment Section */}
      <CommentSection
        postId={post.id}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
      />
    </div>
  );
}

