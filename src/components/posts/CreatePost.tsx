"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ImageIcon, Hash, Send } from "lucide-react";
import { extractTokenMentions } from "@/lib/utils";

interface CreatePostProps {
  onSubmit: (content: string, imageUrl?: string) => Promise<void>;
  isSubmitting?: boolean;
}

export default function CreatePost({ onSubmit, isSubmitting = false }: CreatePostProps) {
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) return;

    try {
      await onSubmit(content.trim(), imageUrl || undefined);
      setContent("");
      setImageUrl("");
      setShowImageInput(false);
    } catch (error) {
      console.error("Failed to create post:", error);
    }
  };

  const tokenMentions = extractTokenMentions(content);

  return (
    <div className="card">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex space-x-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-degen-purple to-degen-pink flex items-center justify-center flex-shrink-0">
            <span className="text-white font-medium text-sm">U</span>
          </div>
          
          <div className="flex-1 space-y-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's happening in the degen world?"
              className="w-full min-h-[100px] resize-none bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
              maxLength={500}
            />
            
            {showImageInput && (
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Image URL (optional)"
                className="input w-full"
              />
            )}

            {tokenMentions.length > 0 && (
              <div className="flex flex-wrap gap-2">
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

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowImageInput(!showImageInput)}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ImageIcon className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Hash className="h-5 w-5" />
                </button>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-xs text-muted-foreground">
                  {content.length}/500
                </span>
                <Button
                  type="submit"
                  disabled={!content.trim() || isSubmitting}
                  size="sm"
                >
                  {isSubmitting ? (
                    "Posting..."
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Post
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

