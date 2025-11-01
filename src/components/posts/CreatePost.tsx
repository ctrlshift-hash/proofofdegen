"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { ImageIcon, Hash, Send } from "lucide-react";
import { extractTokenMentions } from "@/lib/utils";
import Link from "next/link";
import { useWallet } from "@/contexts/WalletContext";

interface CreatePostProps {
  onSubmit: (content: string, imageUrls?: string[]) => Promise<void>;
  isSubmitting?: boolean;
}

export default function CreatePost({ onSubmit, isSubmitting = false }: CreatePostProps) {
  const { data: session } = useSession();
  const { connected, publicKey } = useWallet();
  const [content, setContent] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [showImageInput, setShowImageInput] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Load latest profile image for authenticated user
  useEffect(() => {
    const loadUser = async () => {
      try {
        const id = (session?.user as any)?.id as string | undefined;
        if (id) {
          const res = await fetch(`/api/users/${id}`);
          if (res.ok) {
            const data = await res.json();
            setProfileImage(data.user?.profileImage ?? null);
          }
          return;
        }
        // wallet-only
        if (!id && connected && publicKey) {
          const res = await fetch(`/api/users/byWallet?address=${publicKey.toBase58()}`);
          if (res.ok) {
            const data = await res.json();
            setProfileImage(data.user?.profileImage ?? null);
          }
        }
      } catch {}
    };
    loadUser();
  }, [session?.user, connected, publicKey]);

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

  const handleFileUpload = async (file: File) => {
    if (imageUrls.length >= 4) {
      alert("Maximum 4 images per post");
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB");
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/posts/upload-image", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setImageUrls([...imageUrls, data.imageUrl]);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to upload image");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!content.trim() && imageUrls.length === 0) return;
    try {
      await onSubmit(content.trim(), imageUrls.length > 0 ? imageUrls : undefined);
      setContent("");
      setImageUrls([]);
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
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {profileImage ? (
                <img src={profileImage} alt="avatar" className="h-10 w-10 object-cover" />
              ) : (
                <span className="text-white font-medium text-sm">?</span>
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
                <div className="space-y-2">
                  <input 
                    type="url" 
                    placeholder={`Image URL (optional) ${imageUrls.length >= 4 ? "(Max 4 images)" : ""}`}
                    className="input w-full" 
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const url = (e.target as HTMLInputElement).value.trim();
                        if (url && imageUrls.length < 4) {
                          setImageUrls([...imageUrls, url]);
                          (e.target as HTMLInputElement).value = "";
                        }
                      }
                    }}
                    disabled={imageUrls.length >= 4}
                  />
                  <div className="text-center text-sm text-muted-foreground">or</div>
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(file);
                        }
                      }}
                      className="hidden"
                      disabled={uploadingImage || imageUrls.length >= 4}
                    />
                    <div className="flex items-center justify-center p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors disabled:opacity-50">
                      {uploadingImage ? (
                        <span className="text-sm text-muted-foreground">Uploading...</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          📁 Upload image from device ({imageUrls.length}/4)
                        </span>
                      )}
                    </div>
                  </label>
                  {imageUrls.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {imageUrls.map((url, index) => (
                        <div key={index} className="relative">
                          <img 
                            src={url} 
                            alt={`Preview ${index + 1}`} 
                            className="max-h-32 w-full rounded-lg object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setImageUrls(imageUrls.filter((_, i) => i !== index));
                            }}
                            className="absolute top-1 right-1 bg-black/70 hover:bg-black/90 text-white rounded-full p-1 text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
                  <Button type="submit" disabled={(!content.trim() && imageUrls.length === 0) || isSubmitting} size="sm" className="btn-post">
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
              <div className="space-y-2">
                <input 
                  type="url" 
                  placeholder={`Image URL (optional) ${imageUrls.length >= 4 ? "(Max 4 images)" : ""}`}
                  className="input w-full" 
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const url = (e.target as HTMLInputElement).value.trim();
                      if (url && imageUrls.length < 4) {
                        setImageUrls([...imageUrls, url]);
                        (e.target as HTMLInputElement).value = "";
                      }
                    }
                  }}
                  disabled={imageUrls.length >= 4}
                />
                <div className="text-center text-sm text-muted-foreground">or</div>
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(file);
                      }
                    }}
                    className="hidden"
                    disabled={uploadingImage || imageUrls.length >= 4}
                  />
                  <div className="flex items-center justify-center p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors disabled:opacity-50">
                    {uploadingImage ? (
                      <span className="text-sm text-muted-foreground">Uploading...</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        📁 Upload image from device ({imageUrls.length}/4)
                      </span>
                    )}
                  </div>
                </label>
                {imageUrls.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {imageUrls.map((url, index) => (
                      <div key={index} className="relative">
                        <img 
                          src={url} 
                          alt={`Preview ${index + 1}`} 
                          className="max-h-32 w-full rounded-lg object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImageUrls(imageUrls.filter((_, i) => i !== index));
                          }}
                          className="absolute top-1 right-1 bg-black/70 hover:bg-black/90 text-white rounded-full p-1 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
                <Button type="submit" disabled={(!content.trim() && imageUrls.length === 0) || isSubmitting} size="sm" className="btn-post">
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

