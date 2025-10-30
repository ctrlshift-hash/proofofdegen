"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import CommentCard from "./CommentCard";
import { Button } from "@/components/ui/Button";
import { Send, X } from "lucide-react";

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

interface CommentSectionProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function CommentSection({ postId, isOpen, onClose }: CommentSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch comments when section opens
  useEffect(() => {
    if (isOpen) {
      fetchComments();
    }
  }, [isOpen, postId]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/posts/${postId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newComment }),
      });

      if (response.ok) {
        const newCommentData = await response.json();
        setComments(prev => [...prev, newCommentData]);
        setNewComment("");
      } else {
        console.error("Failed to create comment");
      }
    } catch (error) {
      console.error("Failed to create comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
      <div className="bg-background w-full max-w-2xl max-h-[80vh] rounded-t-lg flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold">Comments</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading comments...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No comments yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Be the first to comment!
              </p>
            </div>
          ) : (
            <div className="space-y-0">
              {comments.map((comment) => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  onLike={(commentId) => {
                    // TODO: Implement comment liking
                    console.log("Like comment:", commentId);
                  }}
                  onReply={(commentId) => {
                    // TODO: Implement comment replies
                    console.log("Reply to comment:", commentId);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Comment Input */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSubmitComment} className="flex space-x-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-medium text-xs">
                {session?.user?.username?.charAt(0).toUpperCase() || "?"}
              </span>
            </div>
            <div className="flex-1 flex space-x-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                maxLength={500}
              />
              <Button
                type="submit"
                disabled={!newComment.trim() || isSubmitting}
                size="sm"
              >
                {isSubmitting ? (
                  "Posting..."
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
