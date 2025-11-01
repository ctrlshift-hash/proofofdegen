"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Layout from "@/components/layout/Layout";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { useWallet } from "@/contexts/WalletContext";

interface ChannelPost { id: string; content: string; createdAt: string; user: { id: string; username: string } }

export default function ChannelPage() {
  const params = useParams();
  const channelId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const { data: session } = useSession();
  const { connected, publicKey } = useWallet();

  const [posts, setPosts] = useState<ChannelPost[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const res = await fetch(`/api/channels/${channelId}/posts`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => { if (channelId) { load(); const id = setInterval(load, 3000); return () => clearInterval(id); } }, [channelId]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (!session?.user && connected && publicKey) headers["X-Wallet-Address"] = publicKey.toBase58();
      const res = await fetch(`/api/channels/${channelId}/posts`, {
        method: "POST",
        headers,
        body: JSON.stringify({ content: content.trim() }),
      });
      if (res.ok) { setContent(""); load(); }
    } catch (e) { console.error(e); }
  };

  return (
    <Layout user={session?.user ? { id: (session.user as any).id, username: (session.user as any).username || "", isVerified: (session.user as any).isVerified || false } : null}>
      <div className="max-w-3xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold">Channel</h1>

        <div className="card">
          <form onSubmit={send} className="flex items-center space-x-2">
            <input className="input w-full" placeholder="Write to channel..." value={content} onChange={(e) => setContent(e.target.value)} />
            <Button type="submit" disabled={!content.trim()}>Send</Button>
          </form>
        </div>

        <div className="space-y-3">
          {posts.length === 0 ? (
            <div className="card p-6 text-sm text-muted-foreground">No messages yet.</div>
          ) : posts.map(p => (
            <div key={p.id} className="card p-4">
              <div className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleString()}</div>
              <div className="font-medium mb-1">@{p.user.username}</div>
              <div>{p.content}</div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

