"use client";

import { useEffect, useState, useCallback } from "react";
import Layout from "@/components/layout/Layout";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Bell, Heart, MessageCircle, Repeat2, Mail, UserPlus, Hash, Megaphone, Sparkles } from "lucide-react";
import Link from "next/link";
import { formatTimeAgo } from "@/lib/utils";
import { useWallet } from "@/contexts/WalletContext";
import { playNotificationSound } from "@/lib/sounds";

interface NotificationItem {
  id: string;
  type: "LIKE" | "COMMENT" | "REPOST" | "MESSAGE" | "FOLLOW" | "CHANNEL_POST" | "BROADCAST" | "TIP";
  createdAt: string;
  read: boolean;
  actor: { id: string; username: string };
  postId?: string | null;
  commentId?: string | null;
  messageId?: string | null;
  channelPostId?: string | null;
}

export default function NotificationsPage() {
  const { data: session } = useSession();
  const { connected, publicKey } = useWallet();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastCount, setLastCount] = useState(0);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (!session?.user && connected && publicKey) {
        headers["X-Wallet-Address"] = publicKey.toString();
      }
      const res = await fetch("/api/notifications", { headers });
      if (res.ok) {
        const data = await res.json();
        const newItems = data.notifications || [];
        const newUnreadCount = newItems.filter((n: NotificationItem) => !n.read).length;
        
        // Check if new notifications arrived (even if it's the first one)
        if (newUnreadCount > lastCount && lastCount >= 0) {
          setHasNewNotifications(true);
          playNotificationSound('notification');
          setTimeout(() => setHasNewNotifications(false), 2000);
        }
        
        setItems(newItems);
        setLastCount(newUnreadCount);
      }
    } catch (e) {
      console.error("Failed to load notifications", e);
    } finally {
      setLoading(false);
    }
  }, [session, connected, publicKey, lastCount]);

  const markAllRead = async () => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (!session?.user && connected && publicKey) {
      headers["X-Wallet-Address"] = publicKey.toString();
    }
    await fetch("/api/notifications", { method: "POST", headers, body: JSON.stringify({}) });
    await load();
  };

  useEffect(() => { 
    load(); 
    // Auto-refresh every 3 seconds for real-time updates
    const interval = setInterval(() => {
      load();
    }, 3000);
    return () => clearInterval(interval);
  }, [load]);

  const getIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "LIKE": return <Heart className="w-4 h-4 text-red-500" />;
      case "COMMENT": return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case "REPOST": return <Repeat2 className="w-4 h-4 text-green-500" />;
      case "MESSAGE": return <Mail className="w-4 h-4 text-purple-500" />;
      case "FOLLOW": return <UserPlus className="w-4 h-4 text-orange-500" />;
      case "CHANNEL_POST": return <Hash className="w-4 h-4 text-cyan-500" />;
      case "BROADCAST": return <Megaphone className="w-4 h-4 text-yellow-500" />;
      case "TIP": return <Sparkles className="w-4 h-4 text-degen-purple" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const label = (n: NotificationItem) => {
    switch (n.type) {
      case "LIKE": return `@${n.actor.username} liked your post`;
      case "COMMENT": return `@${n.actor.username} commented on your post`;
      case "REPOST": return `@${n.actor.username} reposted you`;
      case "MESSAGE": return `New message from @${n.actor.username}`;
      case "FOLLOW": return `@${n.actor.username} followed you`;
      case "CHANNEL_POST": return `@${n.actor.username} posted in a channel`;
      case "BROADCAST": return `Broadcast from @${n.actor.username}`;
      case "TIP": return `@${n.actor.username} sent you a tip 💎`;
      default: return `Activity from @${n.actor.username}`;
    }
  };

  const unreadCount = items.filter(n => !n.read).length;

  return (
    <Layout user={session?.user ? {
      id: (session.user as any).id,
      username: (session.user as any).username || "",
      isVerified: (session.user as any).isVerified || false,
      walletAddress: connected && publicKey ? publicKey.toString() : undefined,
    } : connected && publicKey ? {
      id: "",
      username: "",
      isVerified: false,
      walletAddress: publicKey.toString(),
    } : null}>
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className={`w-6 h-6 ${hasNewNotifications ? "animate-pulse text-red-500" : ""}`} />
            <h2 className="text-xl font-bold">Notifications</h2>
            {unreadCount > 0 && (
              <span className={`px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full transition-all ${
                hasNewNotifications ? "animate-bounce scale-110" : ""
              }`}>
                {unreadCount}
              </span>
            )}
            {hasNewNotifications && (
              <span className="text-xs text-green-500 animate-fade-in">New!</span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="outline" onClick={load} disabled={loading}>
              {loading ? "Loading…" : "Refresh"}
            </Button>
            {unreadCount > 0 && (
              <Button size="sm" onClick={markAllRead}>
                Mark all read
              </Button>
            )}
          </div>
        </div>

        <div className="card">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">No notifications yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {items.map(n => (
                <div
                  key={n.id}
                  className={`px-4 py-3 hover:bg-accent/50 transition-colors ${
                    !n.read ? "bg-blue-500/10 border-l-4 border-l-blue-500" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/profile/${n.actor.id}`}
                          className="text-sm font-medium hover:underline"
                        >
                          {label(n)}
                        </Link>
                        {!n.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatTimeAgo(n.createdAt)}
                      </div>
                      {(n.postId || n.messageId) && (
                        <div className="mt-2">
                          {n.postId && (
                            <Link
                              href={`/?post=${n.postId}`}
                              className="text-xs text-blue-500 hover:underline"
                            >
                              View post →
                            </Link>
                          )}
                          {n.messageId && (
                            <Link
                              href="/messages"
                              className="text-xs text-blue-500 hover:underline"
                            >
                              View message →
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

