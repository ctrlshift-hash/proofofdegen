"use client";

import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/layout/Layout";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { useWallet } from "@/contexts/WalletContext";

interface UserRef { id: string; username: string }
interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender: UserRef;
  recipient: UserRef;
}

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const { connected, publicKey } = useWallet();
  const [conversations, setConversations] = useState<Array<{ id: string; withUser: UserRef; lastMessage?: Message | null }>>([]);
  const [activeUsername, setActiveUsername] = useState<string>("");
  const [thread, setThread] = useState<Message[]>([]);
  const [composeTo, setComposeTo] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [loadingThread, setLoadingThread] = useState(false);
  const canSend = !!session?.user || (connected && !!publicKey);
  const myUsername = useMemo(() => (session?.user as any)?.username as string | undefined, [session?.user]);

  const loadConversations = async () => {
    try {
      const headers: Record<string, string> = {};
      if (!status || status !== "authenticated") {
        if (connected && publicKey) headers["X-Wallet-Address"] = publicKey.toBase58();
      }
      const res = await fetch("/api/messages", { headers });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (e) {
      console.error("Failed to load conversations", e);
    }
  };

  const openThread = async (username: string) => {
    setActiveUsername(username);
    setLoadingThread(true);
    try {
      const headers: Record<string, string> = {};
      if (!session?.user && connected && publicKey) headers["X-Wallet-Address"] = publicKey.toBase58();
      const res = await fetch(`/api/messages/${encodeURIComponent(username)}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setThread(data.messages || []);
      } else if (res.status === 401) {
        console.warn("Not authenticated to open thread.");
      }
    } catch (e) {
      console.error("Failed to open thread", e);
    } finally {
      setLoadingThread(false);
    }
  };

  const poll = useMemo(() => ({ interval: 3000 }), []);
  useEffect(() => {
    // initial
    loadConversations();
    // polling
    const id = setInterval(async () => {
      await loadConversations();
      if (activeUsername) await openThread(activeUsername);
    }, poll.interval);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeUsername, status, connected, publicKey]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const to = activeUsername || composeTo;
    if (!to || !newMessage.trim()) return;
    try {
      const body: any = { content: newMessage };
      if (!session?.user && connected && publicKey) body.walletAddress = publicKey.toBase58();
      const res = await fetch(`/api/messages/${encodeURIComponent(to)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        if (activeUsername) {
          setThread(prev => [...prev, data.message]);
        } else {
          await openThread(to);
          await loadConversations();
        }
        setNewMessage("");
        setComposeTo("");
      } else if (res.status === 401) {
        console.warn("Not authenticated to send message.");
      }
    } catch (e) {
      console.error("Failed to send message", e);
    }
  };

  return (
    <Layout user={session?.user ? {
      id: (session.user as any).id,
      username: (session.user as any).username || "",
      isVerified: (session.user as any).isVerified || false,
    } : null}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto w-full">
        {/* Conversations list */}
        <div className="card lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Messages</h2>
            <Button size="sm" variant="outline" onClick={loadConversations}>Refresh</Button>
          </div>

          <div className="space-y-1">
            {conversations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No conversations yet</p>
            ) : conversations.map(c => (
              <button key={c.id} onClick={() => openThread(c.withUser.username)} className={`w-full text-left px-3 py-2 rounded-md transition-colors ${activeUsername === c.withUser.username ? "bg-accent" : "hover:bg-muted/50"}`}>
                <div className="font-medium truncate">@{c.withUser.username}</div>
                {c.lastMessage && (
                  <div className="text-xs text-muted-foreground truncate">
                    <span className="font-semibold">{c.lastMessage.sender.username}:</span> {c.lastMessage.content}
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="mt-6 border-t border-border pt-4">
            <h3 className="text-sm font-semibold mb-2">Start a new DM</h3>
            {!canSend && (
              <div className="mb-2 text-xs text-muted-foreground">
                You need to sign in with email or connect a wallet to send DMs.
              </div>
            )}
            <form onSubmit={sendMessage} className="space-y-2">
              <input type="text" placeholder="Recipient username (without @)" value={composeTo} onChange={(e) => setComposeTo(e.target.value)} className="input w-full" />
              <textarea placeholder="Your message" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className="input w-full min-h-[80px]" />
              <Button type="submit" size="sm" disabled={(!composeTo && !activeUsername) || !newMessage.trim() || !canSend}>Send</Button>
            </form>
          </div>
        </div>

        {/* Thread */}
        <div className="card lg:col-span-2">
          {activeUsername ? (
            <div className="flex flex-col h-[600px]">
              {/* Sticky header */}
              <div className="border-b border-border pb-3 mb-3 sticky top-0 bg-card z-10 flex items-center justify-between">
                <h2 className="text-lg font-semibold">@{activeUsername}</h2>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => { try { await navigator.clipboard.writeText(activeUsername); } catch {} }}
                >
                  Copy username
                </Button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {loadingThread ? (
                  <p className="text-sm text-muted-foreground">Loading…</p>
                ) : thread.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No messages yet. Say hello!</p>
                ) : (
                  thread.map(m => {
                    const mine = m.sender.username === myUsername;
                    return (
                      <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] px-3 py-2 rounded-2xl ${mine ? "bg-degen-purple/20 text-foreground" : "bg-muted text-foreground"}`}>
                          {!mine && (
                            <div className="text-[10px] text-muted-foreground mb-1">{m.sender.username}</div>
                          )}
                          <div>{m.content}</div>
                          <div className="text-[10px] text-muted-foreground mt-1">{new Date(m.createdAt).toLocaleTimeString()}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Composer */}
              <form onSubmit={sendMessage} className="mt-3 flex items-center space-x-2">
                <input type="text" placeholder="Type a message" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className="input w-full" />
                <Button type="submit" disabled={!newMessage.trim() || !canSend}>Send</Button>
              </form>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Select a conversation or start a new one.
              {!canSend && (
                <div className="mt-2">You need to sign in with email or connect a wallet to send DMs.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
