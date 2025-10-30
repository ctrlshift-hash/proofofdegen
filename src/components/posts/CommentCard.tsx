"use client";

import { useState } from "react";
import { formatTimeAgo } from "@/lib/utils";
import { Heart, MessageCircle, Repeat2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Comment {
  id: string;
  content: string;
  createdAt: Date | string;
  user: {
    id: string;
    username: string;
    walletAddress?: string;
    isVerified: boolean;
    profileImage?: string;
  };
}

interface CommentCardProps {
  comment: Comment;
  onLike?: (commentId: string) => void;
  onReply?: (commentId: string) => void;
}

export default function CommentCard({ comment, onLike, onReply }: CommentCardProps) {
  const [isLiked, setIsLiked] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    onLike?.(comment.id);
  };

  const handleReply = () => {
    onReply?.(comment.id);
  };

  return (
    <div className="flex space-x-3 py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      {/* Avatar */}
      <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center flex-shrink-0">
        <span className="text-white font-medium text-xs">
          {comment.user.username?.charAt(0).toUpperCase() || "?"}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center space-x-2 mb-1">
          <span className="font-medium text-sm">{comment.user.username}</span>
          {comment.user.isVerified && (
            <div className="h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
          )}
          <span className="text-muted-foreground text-sm">
            · {formatTimeAgo(comment.createdAt)}
          </span>
        </div>

        {/* Comment Text */}
        <p className="text-sm text-foreground mb-2">{comment.content}</p>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          <button
            onClick={handleLike}
            className={`flex items-center space-x-1 text-xs transition-colors ${
              isLiked
                ? "text-red-500"
                : "text-muted-foreground hover:text-red-500"
            }`}
          >
            <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
            <span>0</span>
          </button>

          <button
            onClick={handleReply}
            className="flex items-center space-x-1 text-xs text-muted-foreground hover:text-blue-500 transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Reply</span>
          </button>

          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
