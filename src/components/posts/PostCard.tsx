"use client";

import { useState } from "react";
import Link from "next/link";
import UserHoverCard from "@/components/users/UserHoverCard";
import { Button } from "@/components/ui/Button";
import { 
  ThumbsUp, ThumbsDown,
  MessageCircle, 
  Repeat2, 
  Share, 
  MoreHorizontal,
  CheckCircle,
  Wallet
} from "lucide-react";
import { formatTimeAgo, formatNumber, extractTokenMentions, extractHashtags } from "@/lib/utils";
import { useRouter } from "next/navigation";
import CommentSection from "./CommentSection";
import TipModal from "./TipModal";
import { useSession } from "next-auth/react";
import { useWallet } from "@/contexts/WalletContext";
import { isGoldVerified } from "@/lib/gold-verified";

interface Post {
  id: string;
  content: string;
  imageUrls?: string[];
  likesCount: number;
  downvotesCount?: number;
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
  isDownvoted?: boolean;
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
  const [isDownvoting, setIsDownvoting] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const { data: session } = useSession();
  const { publicKey, connected } = useWallet();
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  // Optimistic interaction state
  const [liked, setLiked] = useState<boolean>(!!post.isLiked);
  const [likesCount, setLikesCount] = useState<number>(post.likesCount);
  const [reposted, setReposted] = useState<boolean>(!!post.isReposted);
  const [repostsCount, setRepostsCount] = useState<number>(post.repostsCount);
  const [downvoted, setDownvoted] = useState<boolean>(!!post.isDownvoted);
  const [downvotesCount, setDownvotesCount] = useState<number>(post.downvotesCount || 0);

  const tokenMentions = extractTokenMentions(post.content);
  const hashtags = extractHashtags(post.content);

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      setLiked(prev => !prev);
      setLikesCount(prev => (liked ? prev - 1 : prev + 1));
      await onLike(post.id);
    } finally {
      setIsLiking(false);
    }
  };

  const handleRepost = async () => {
    if (isReposting) return;
    setIsReposting(true);
    try {
      setReposted(prev => !prev);
      setRepostsCount(prev => (reposted ? prev - 1 : prev + 1));
      await onRepost(post.id);
    } finally {
      setIsReposting(false);
    }
  };

  const handleDownvote = async () => {
    if (isDownvoting) return;
    setIsDownvoting(true);
    try {
      setDownvoted(prev => !prev);
      setDownvotesCount(prev => (downvoted ? prev - 1 : prev + 1));
      const headers: Record<string, string> = {};
      if (!session?.user && publicKey) headers["X-Wallet-Address"] = publicKey.toBase58();
      await fetch(`/api/posts/${post.id}/downvote`, { method: "POST", headers });
    } catch (e) {
      // revert on error
      setDownvoted(prev => !prev);
      setDownvotesCount(prev => (downvoted ? prev + 1 : prev - 1));
      console.error(e);
    } finally {
      setIsDownvoting(false);
    }
  };

  const handleHashtagClick = (hashtag: string) => {
    router.push(`/trending?hashtag=${encodeURIComponent(hashtag)}`);
  };

  const renderContent = (text: string) => {
    // Split by both tokens and hashtags
    const parts = text.split(/(\$[A-Z]{2,10}|#[\w]+)/g);
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
      if (part.match(/^#[\w]+$/)) {
        return (
          <span
            key={index}
            onClick={() => handleHashtagClick(part)}
            className="text-blue-500 font-medium hover:underline cursor-pointer"
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
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
            <UserHoverCard userId={post.user.id} username={post.user.username}>
              <Link 
                href={`/profile/${post.user.id}`}
                className="font-medium hover:underline"
              >
                {post.user.username}
              </Link>
            </UserHoverCard>
            <button
              onClick={async () => { try { await navigator.clipboard.writeText(post.user.username); setCopied(true); setTimeout(() => setCopied(false), 1200); } catch {} }}
              className="text-xs px-2 py-0.5 rounded bg-muted hover:bg-muted/80 transition-colors"
              title="Copy username"
            >
              {copied ? "Copied" : "Copy"}
            </button>
            
            {(post.user.walletAddress || (post.user as any).email) && (
              <span className="flex items-center gap-1">
                <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full ${isGoldVerified(post.user) ? "bg-yellow-400 text-black" : "bg-blue-500 text-white"}`}>
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.004 7.004a1 1 0 01-1.414 0L3.293 9.714a1 1 0 111.414-1.414l3.004 3.004 6.297-6.297a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                </span>
                {isGoldVerified(post.user) && post.user.username === "Alon" && (
                  <img src="https://static.wixstatic.com/media/e2da02_248e6293fa024f6e9dd4130271bb14c3~mv2.png" alt="pill" className="w-3.5 h-3.5" />
                )}
                <span className="pill-btn text-[10px] leading-none">Verified</span>
              </span>
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
                <div className="absolute right-0 mt-2 bg-card/80 backdrop-blur-sm border border-border rounded-md shadow-lg p-2 text-sm">
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
          <div className="mb-4">
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

          {/* Post Images */}
          {post.imageUrls && post.imageUrls.length > 0 && (
            <div className={`mb-3 ${post.imageUrls.length === 1 ? 'flex justify-start' : ''}`}>
              {post.imageUrls.length === 1 ? (
                <div className="rounded-lg overflow-hidden">
                  <img
                    src={post.imageUrls[0]}
                    alt="Post image"
                    className="max-w-full h-auto max-h-[600px] object-contain"
                  />
                </div>
              ) : post.imageUrls.length === 2 ? (
                <div className="grid grid-cols-2 gap-2">
                  {post.imageUrls.map((url, index) => (
                    <div key={index} className="rounded-lg overflow-hidden">
                      <img
                        src={url}
                        alt={`Post image ${index + 1}`}
                        className="w-full h-auto max-h-[400px] object-contain"
                      />
                    </div>
                  ))}
                </div>
              ) : post.imageUrls.length === 3 ? (
                <div className="grid grid-cols-2 gap-2">
                  <div className="row-span-2 rounded-lg overflow-hidden">
                    <img
                      src={post.imageUrls[0]}
                      alt="Post image 1"
                      className="w-full h-full max-h-[400px] object-cover"
                    />
                  </div>
                  <div className="rounded-lg overflow-hidden">
                    <img
                      src={post.imageUrls[1]}
                      alt="Post image 2"
                      className="w-full h-auto max-h-[195px] object-cover"
                    />
                  </div>
                  <div className="rounded-lg overflow-hidden">
                    <img
                      src={post.imageUrls[2]}
                      alt="Post image 3"
                      className="w-full h-auto max-h-[195px] object-cover"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {post.imageUrls.slice(0, 4).map((url, index) => (
                    <div key={index} className="rounded-lg overflow-hidden">
                      <img
                        src={url}
                        alt={`Post image ${index + 1}`}
                        className="w-full h-auto max-h-[400px] object-contain"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between max-w-md">
            <button
              onClick={handleLike}
              disabled={isLiking}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                liked
                  ? "text-red-500 bg-red-500/10 ring-2 ring-red-500/30 scale-[1.02]"
                  : "text-muted-foreground hover:text-red-500 hover:bg-red-500/10 hover:scale-[1.02]"
              }`}
              title="Agree (upvote)"
            >
              <ThumbsUp className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
              <span className="text-sm font-medium">
                {formatNumber(likesCount)}
              </span>
            </button>

            <button
              onClick={handleDownvote}
              disabled={isDownvoting}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${downvoted ? "text-blue-400 bg-blue-400/10 ring-2 ring-blue-400/30 scale-[1.02]" : "text-muted-foreground hover:text-blue-400 hover:bg-blue-400/10 hover:scale-[1.02]"}`}
              title="Disagree (downvote)"
            >
              <ThumbsDown className="h-4 w-4" />
              <span className="text-sm font-medium">{formatNumber(downvotesCount)}</span>
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
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                reposted
                  ? "text-green-500 bg-green-500/10 ring-2 ring-green-500/30 scale-[1.02]"
                  : "text-muted-foreground hover:text-green-500 hover:bg-green-500/10 hover:scale-[1.02]"
              }`}
            >
              <Repeat2 className={`h-4 w-4 ${reposted ? "fill-current" : ""}`} />
              <span className="text-sm font-medium">
                {formatNumber(repostsCount)}
              </span>
            </button>

            {(connected && publicKey) && (
              <button
                onClick={() => {
                  if (post.user.walletAddress) {
                    setShowTipModal(true);
                  } else {
                    // Show message encouraging wallet connection
                    alert("💎 This user hasn't connected their wallet yet. Only users with connected wallets can receive tips! Connect your wallet to enable tipping.");
                  }
                }}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  post.user.walletAddress
                    ? "text-muted-foreground hover:text-degen-purple hover:bg-degen-purple/10"
                    : "text-muted-foreground/50 cursor-not-allowed opacity-60"
                }`}
                title={post.user.walletAddress ? "Send a tip" : "This user needs to connect their wallet to receive tips"}
                disabled={!post.user.walletAddress}
              >
                <span className="text-sm font-medium">💎</span>
                <span className="text-sm font-medium">Tip</span>
                {!post.user.walletAddress && (
                  <span className="text-[10px] text-muted-foreground">(Wallet required)</span>
                )}
              </button>
            )}

            <button
              onClick={async () => {
                try {
                  const postUrl = `${window.location.origin}/posts/${post.id}`;
                  if (navigator.share) {
                    await navigator.share({
                      title: `Post by @${post.user.username}`,
                      text: post.content.slice(0, 100),
                      url: postUrl,
                    });
                  } else {
                    await navigator.clipboard.writeText(postUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }
                } catch (error) {
                  // User cancelled share or clipboard failed
                  try {
                    const postUrl = `${window.location.origin}/posts/${post.id}`;
                    await navigator.clipboard.writeText(postUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  } catch (e) {
                    console.error("Failed to share:", e);
                  }
                }
              }}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              title="Share post"
            >
              <Share className="h-4 w-4" />
              {copied && (
                <span className="text-xs text-green-500">Copied!</span>
              )}
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

      {/* Tip Modal */}
      {showTipModal && post.user.walletAddress && (
        <TipModal
          isOpen={showTipModal}
          onClose={() => setShowTipModal(false)}
          postId={post.id}
          recipientAddress={post.user.walletAddress}
          recipientUsername={post.user.username}
          onSuccess={() => {
            // Optionally refresh post data or show success message
            setShowTipModal(false);
          }}
        />
      )}
    </div>
  );
}

