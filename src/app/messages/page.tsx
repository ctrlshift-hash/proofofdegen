"use client";

import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";

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
  const [conversations, setConversations] = useState<Array<{ id: string; withUser: UserRef; lastMessage?: Message | null }>>([]);
  const [activeUsername, setActiveUsername] = useState<string>("");
  const [thread, setThread] = useState<Message[]>([]);
  const [composeTo, setComposeTo] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [loadingThread, setLoadingThread] = useState(false);

  const loadConversations = async () => {
    try {
      const res = await fetch("/api/messages");
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
      const res = await fetch(`/api/messages/${encodeURIComponent(username)}`);
      if (res.ok) {
        const data = await res.json();
        setThread(data.messages || []);
      }
    } catch (e) {
      console.error("Failed to open thread", e);
    } finally {
      setLoadingThread(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const to = activeUsername || composeTo;
    if (!to || !newMessage.trim()) return;
    try {
      const res = await fetch(`/api/messages/${encodeURIComponent(to)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage }),
      });
      if (res.ok) {
        const data = await res.json();
        if (activeUsername) {
          setThread(prev => [...prev, data.message]);
        } else {
          // If composing a new DM, open the thread
          await openThread(to);
          await loadConversations();
        }
        setNewMessage("");
        setComposeTo("");
      }
    } catch (e) {
      console.error("Failed to send message", e);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      loadConversations();
    }
  }, [status]);

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

          <div className="space-y-2">
            {conversations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No conversations yet</p>
            ) : conversations.map(c => (
              <button key={c.id} onClick={() => openThread(c.withUser.username)} className="w-full text-left px-3 py-2 rounded-md hover:bg-muted/50">
                <div className="font-medium">@{c.withUser.username}</div>
                {c.lastMessage && (
                  <div className="text-xs text-muted-foreground truncate">
                    <span className="font-semibold">{c.lastMessage.sender.username}:</span> {c.lastMessage.content}
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Start new conversation */}
          <div className="mt-6 border-t border-border pt-4">
            <h3 className="text-sm font-semibold mb-2">Start a new DM</h3>
            <form onSubmit={sendMessage} className="space-y-2">
              <input
                type="text"
                placeholder="Recipient username (without @)"
                value={composeTo}
                onChange={(e) => setComposeTo(e.target.value)}
                className="input w-full"
              />
              <textarea
                placeholder="Your message"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="input w-full min-h-[80px]"
              />
              <Button type="submit" size="sm" disabled={!composeTo || !newMessage.trim()}>Send</Button>
            </form>
          </div>
        </div>

        {/* Thread */}
        <div className="card lg:col-span-2">
          {activeUsername ? (
            <div className="flex flex-col h-[600px]">
              <div className="border-b border-border pb-3 mb-3">
                <h2 className="text-lg font-semibold">@{activeUsername}</h2>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {loadingThread ? (
                  <p className="text-sm text-muted-foreground">Loading…</p>
                ) : thread.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No messages yet. Say hello!</p>
                ) : (
                  thread.map(m => (
                    <div key={m.id} className="flex flex-col">
                      <div className="text-xs text-muted-foreground">{m.sender.username}</div>
                      <div className="px-3 py-2 rounded-lg bg-muted w-fit max-w-[80%]">{m.content}</div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={sendMessage} className="mt-3 flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Type a message"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="input w-full"
                />
                <Button type="submit" disabled={!newMessage.trim()}>Send</Button>
              </form>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Select a conversation or start a new one.</div>
          )}
        </div>
      </div>
    </Layout>
  );
}
