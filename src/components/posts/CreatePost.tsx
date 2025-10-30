"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { ImageIcon, Hash, Send } from "lucide-react";
import { extractTokenMentions } from "@/lib/utils";
import Link from "next/link";
import { useWallet } from "@/contexts/WalletContext";

interface CreatePostProps {
  onSubmit: (content: string, imageUrl?: string) => Promise<void>;
  isSubmitting?: boolean;
}

export default function CreatePost({ onSubmit, isSubmitting = false }: CreatePostProps) {
  const { data: session } = useSession();
  const { connected, publicKey } = useWallet();
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Load latest profile image for authenticated user
  useEffect(() => {
    const loadUser = async () => {
      try {
        const id = (session?.user as any)?.id as string | undefined;
        if (!id) { setProfileImage(null); return; }
        const res = await fetch(`/api/users/${id}`);
        if (res.ok) {
          const data = await res.json();
          setProfileImage(data.user?.profileImage ?? null);
        }
      } catch {}
    };
    loadUser();
  }, [session?.user]);

  // For wallet-only guests, try to grab their anon profile to show avatar
  const [guestDisplay, setGuestDisplay] = useState<{ image: string | null; initial: string } | null>(null);
  useEffect(() => {
    const loadWalletUser = async () => {
      if (session?.user) { setGuestDisplay(null); return; }
      if (!connected || !publicKey) { setGuestDisplay(null); return; }
      try {
        const res = await fetch(`/api/users/byWallet?address=${publicKey.toBase58()}`);
        if (res.ok) {
          const data = await res.json();
          const u = data.user;
          setGuestDisplay({ image: u?.profileImage ?? null, initial: (u?.username || "U").charAt(0).toUpperCase() });
        }
      } catch { setGuestDisplay(null); }
    };
    loadWalletUser();
  }, [connected, publicKey, session?.user]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

  // Show optional login prompt if not authenticated
  if (!session?.user) {
    return (
      <div className="card">
        <div className="text-center py-4 mb-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          {connected ? (
            <>
              <p className="text-sm text-blue-400">
                ✔ Wallet connected. You can post now without an account; or sign up to unlock extras.
              </p>
              <div className="flex gap-2 justify-center mt-2">
                <Link href="/auth/signup">
                  <Button size="sm" variant="outline">Sign Up</Button>
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-blue-400">
                💡 <strong>Tip:</strong> Connect your wallet for portfolio display, tipping, and exclusive features!
              </p>
              <div className="flex gap-2 justify-center mt-2">
                <Link href="/auth/login">
                  <Button size="sm" variant="outline">Connect Wallet</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm" variant="outline">Sign Up</Button>
                </Link>
              </div>
            </>
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex space-x-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center flex-shrink-0">
              {guestDisplay?.image ? (
                <img src={guestDisplay.image} alt="avatar" className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <span className="text-white font-medium text-sm">{guestDisplay?.initial || "?"}</span>
              )}
            </div>
            <div className="flex-1 space-y-3">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                placeholder="What's happening in the degen world? (Posting as guest)"
                className="w-full min-h-[100px] resize-none bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
                maxLength={500}
              />
              {showImageInput && (
                <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL (optional)" className="input w-full" />
              )}
              {tokenMentions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tokenMentions.map((token, index) => (
                    <span key={index} className="px-2 py-1 bg-purple-600/10 text-purple-600 rounded-full text-sm font-medium">{token}</span>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button type="button" onClick={() => setShowImageInput(!showImageInput)} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                    <ImageIcon className="h-5 w-5" />
                  </button>
                  <button type="button" className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                    <Hash className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-muted-foreground">{content.length}/500</span>
                  <Button type="submit" disabled={!content.trim() || isSubmitting} size="sm">
                    {isSubmitting ? ("Posting...") : (<><Send className="h-4 w-4 mr-2" />Post as Guest</>)}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="card">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex space-x-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {profileImage ? (
              <img src={profileImage} alt="avatar" className="h-10 w-10 object-cover" />
            ) : (
              <span className="text-white font-medium text-sm">{(session.user as any).username?.charAt(0).toUpperCase() || "U"}</span>
            )}
          </div>
          <div className="flex-1 space-y-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
              placeholder="What's happening in the degen world?"
              className="w-full min-h-[100px] resize-none bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
              maxLength={500}
            />
            {showImageInput && (
              <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL (optional)" className="input w-full" />
            )}
            {tokenMentions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tokenMentions.map((token, index) => (
                  <span key={index} className="px-2 py-1 bg-degen-purple/10 text-degen-purple rounded-full text-sm font-medium">{token}</span>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button type="button" onClick={() => setShowImageInput(!showImageInput)} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                  <ImageIcon className="h-5 w-5" />
                </button>
                <button type="button" className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                  <Hash className="h-5 w-5" />
                </button>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-xs text-muted-foreground">{content.length}/500</span>
                <Button type="submit" disabled={!content.trim() || isSubmitting} size="sm">
                  {isSubmitting ? ("Posting...") : (<><Send className="h-4 w-4 mr-2" />Post</>)}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

