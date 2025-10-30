"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Layout from "@/components/layout/Layout";
import PostCard from "@/components/posts/PostCard";
import { Button } from "@/components/ui/Button";
import { Calendar, Wallet, CheckCircle, MessageCircle, Settings } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useWallet } from "@/contexts/WalletContext";

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { connected, publicKey } = useWallet();
  const userId = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string);

  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editImage, setEditImage] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [uploading, setUploading] = useState(false);
  const isOwn = (session?.user && (session.user as any).id === userId) || (!!publicKey && user?.walletAddress === publicKey.toBase58());

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setPosts(data.posts);
      }
    } catch (e) {
      console.error("Failed to load profile", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { if (userId) fetchProfile(); }, [userId]);

  const handleUpdateImage = async () => {
    if (!editImage.trim()) return;
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (!session?.user && publicKey) headers["X-Wallet-Address"] = publicKey.toBase58();
      const res = await fetch(`/api/users/${userId}`, { method: "PATCH", headers, body: JSON.stringify({ profileImage: editImage }) });
      if (res.ok) { setEditImage(""); fetchProfile(); }
    } catch (e) { console.error("Failed to update image", e); }
  };

  const handleUploadFile = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const headers: Record<string, string> = {};
      if (!session?.user && publicKey) headers["X-Wallet-Address"] = publicKey.toBase58();
      const res = await fetch(`/api/users/${userId}/avatar`, { method: "POST", headers, body: form });
      if (res.ok) { await fetchProfile(); }
    } catch (e) { console.error("Upload failed", e); }
    finally { setUploading(false); }
  };

  const handleLike = async (postId: string) => {};
  const handleRepost = async (postId: string) => {};
  const handleComment = (postId: string) => {};
  const handleTip = (postId: string) => {};

  return (
    <Layout user={session?.user ? { id: (session.user as any).id, username: (session.user as any).username || "", isVerified: (session.user as any).isVerified || false } : null}>
      <div className="max-w-4xl mx-auto">
        {isLoading || !user ? (
          <div className="card p-8">Loading…</div>
        ) : (
          <>
            <div className="card mb-6">
              <div className="flex flex-col md:flex-row md:items-start space-y-4 md:space-y-0 md:space-x-6">
                <div className="flex-shrink-0">
                  <div className="h-24 w-24 rounded-full bg-gradient-to-r from-degen-purple to-degen-pink flex items-center justify-center overflow-hidden">
                    {user.profileImage ? (
                      <img src={user.profileImage} alt={user.username} className="h-24 w-24 rounded-full object-cover" />
                    ) : (
                      <span className="text-white font-bold text-2xl">{user.username.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <h1 className="text-2xl font-bold">{user.username}</h1>
                        <button
                          className="text-xs px-2 py-0.5 rounded bg-muted hover:bg-muted/80 transition-colors"
                          onClick={async () => { try { await navigator.clipboard.writeText(user.username); } catch {} }}
                          title="Copy username"
                        >
                          Copy
                        </button>
                        {user.isVerified && (<CheckCircle className="h-6 w-6 text-blue-500" />)}
                      </div>
                      {user.walletAddress && (
                        <div className="flex items-center space-x-2 text-muted-foreground mb-2">
                          <Wallet className="h-4 w-4" />
                          <span className="font-mono text-sm">{user.walletAddress.slice(0, 8)}...{user.walletAddress.slice(-8)}</span>
                        </div>
                      )}
                      {user.bio && (<p className="text-foreground mb-4">{user.bio}</p>)}
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                      <Button variant="outline" size="sm" onClick={() => router.push(`/messages?to=${encodeURIComponent(user.username)}`)}>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                      {isOwn && (
                        <Button variant="ghost" size="sm" onClick={() => document.getElementById("edit-pfp")?.scrollIntoView({ behavior: "smooth" })}>
                          <Settings className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {isOwn && (
                    <div id="edit-pfp" className="mt-4 p-3 bg-muted/30 rounded-lg space-y-3">
                      <div className="text-sm font-semibold">Change username</div>
                      <div className="flex items-center space-x-2">
                        <input type="text" placeholder={user.username} value={editUsername} onChange={(e) => setEditUsername(e.target.value)} className="input w-full" />
                        <Button size="sm" onClick={async () => { if (!editUsername.trim()) return; try { const headers: Record<string, string> = { "Content-Type": "application/json" }; if (!session?.user && publicKey) headers["X-Wallet-Address"] = publicKey.toBase58(); const res = await fetch(`/api/users/${userId}`, { method: "PATCH", headers, body: JSON.stringify({ username: editUsername }) }); if (res.ok) { setEditUsername(""); fetchProfile(); } else { const err = await res.json(); alert(err.error || "Failed"); } } catch (e) {} }}>Save</Button>
                      </div>

                      <div className="text-sm font-semibold">Change profile picture (URL)</div>
                      <div className="flex items-center space-x-2">
                        <input type="url" placeholder="https://…" value={editImage} onChange={(e) => setEditImage(e.target.value)} className="input w-full" />
                        <Button size="sm" onClick={handleUpdateImage} disabled={!editImage.trim()}>Save</Button>
                      </div>

                      <div className="text-sm font-semibold">Or upload from your device</div>
                      <div className="flex items-center space-x-2">
                        <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleUploadFile(f); }} className="block text-sm" />
                        {uploading && <span className="text-xs text-muted-foreground">Uploading…</span>}
                      </div>
                      <div className="text-[11px] text-muted-foreground">Max 2MB.</div>

                      <div className="text-sm font-semibold">Edit bio</div>
                      <div className="flex items-center space-x-2">
                        <input type="text" placeholder={user.bio || "Write a short bio"} value={editBio} onChange={(e) => setEditBio(e.target.value)} className="input w-full" />
                        <Button size="sm" onClick={async () => { if (!editBio.trim()) return; try { const headers: Record<string, string> = { "Content-Type": "application/json" }; if (!session?.user && publicKey) headers["X-Wallet-Address"] = publicKey.toBase58(); const res = await fetch(`/api/users/${userId}`, { method: "PATCH", headers, body: JSON.stringify({ bio: editBio }) }); if (res.ok) { setEditBio(""); fetchProfile(); } } catch (e) {} }}>Save</Button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-6 mt-6 pt-6 border-t border-border">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{formatNumber(posts.length)}</div>
                      <div className="text-sm text-muted-foreground">Posts</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold">Posts</h2>
              {posts.length === 0 ? (
                <div className="text-center py-12"><p className="text-muted-foreground">No posts yet</p></div>
              ) : (
                posts.map((post) => (
                  <PostCard key={post.id} post={post} onLike={handleLike} onRepost={handleRepost} onComment={handleComment} onTip={handleTip} />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

