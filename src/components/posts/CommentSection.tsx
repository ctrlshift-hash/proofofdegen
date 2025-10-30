"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useWallet } from "@/contexts/WalletContext";

interface UserRef { id: string; username: string; walletAddress?: string | null; isVerified: boolean; profileImage?: string | null }
interface Comment { id: string; content: string; createdAt: string; user: UserRef }

interface CommentSectionProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function CommentSection({ postId, isOpen, onClose }: CommentSectionProps) {
  const { data: session } = useSession();
  const { publicKey } = useWallet();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { if (isOpen) fetchComments(); }, [isOpen, postId]);

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
    } finally { setIsLoading(false); }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });
      if (response.ok) {
        const created = await response.json();
        setComments(prev => [...prev, created]);
        setNewComment("");
      } else {
        console.error("Failed to create comment");
      }
    } catch (error) {
      console.error("Failed to create comment:", error);
    } finally { setIsSubmitting(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="mt-4 border-t border-border pt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold">Comments</h4>
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">Close</button>
      </div>

      {/* List */}
      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Be the first to comment.</p>
        ) : (
          comments.map((c) => {
            const initial = c.user.username?.charAt(0)?.toUpperCase?.() || "U";
            const isOwner = (session?.user as any)?.id === c.user.id || (!!publicKey && c.user.walletAddress === publicKey.toBase58());
            return (
              <div key={c.id} className="flex items-start space-x-3">
                {/* Avatar */}
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-degen-purple to-degen-pink flex items-center justify-center text-white text-xs flex-shrink-0">
                  {initial}
                </div>
                {/* Bubble */}
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{c.user.username}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(c.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="mt-1 inline-block bg-muted px-3 py-2 rounded-2xl text-sm leading-relaxed">
                    {c.content}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground space-x-3">
                    <button className="hover:text-foreground">Like</button>
                    <button className="hover:text-foreground">Reply</button>
                    {isOwner && (
                      <button
                        className="hover:text-red-500"
                        onClick={async () => {
                          try {
                            const headers: Record<string, string> = {};
                            if (!session?.user && publicKey) headers["X-Wallet-Address"] = publicKey.toBase58();
                            const res = await fetch(`/api/posts/${postId}/comments?commentId=${c.id}`, { method: "DELETE", headers });
                            if (res.ok) setComments(prev => prev.filter(x => x.id !== c.id));
                          } catch (e) { console.error(e); }
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Composer */}
      <form onSubmit={handleSubmitComment} className="mt-3 flex items-center space-x-2">
        <input
          type="text"
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="input w-full"
        />
        <Button type="submit" disabled={!newComment.trim() || isSubmitting}>
          {isSubmitting ? "Posting…" : "Reply"}
        </Button>
      </form>
    </div>
  );
}
