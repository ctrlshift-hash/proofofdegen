"use client";

import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";

interface NotificationItem {
  id: string;
  type: "LIKE" | "COMMENT" | "REPOST" | "MESSAGE" | "FOLLOW";
  createdAt: string;
  read: boolean;
  actor: { id: string; username: string };
  postId?: string | null;
  messageId?: string | null;
}

export default function NotificationsPage() {
  const { data: session } = useSession();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setItems(data.notifications || []);
      }
    } catch (e) {
      console.error("Failed to load notifications", e);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    await load();
  };

  useEffect(() => { load(); }, []);

  const label = (n: NotificationItem) => {
    switch (n.type) {
      case "LIKE": return `@${n.actor.username} liked your post`;
      case "COMMENT": return `@${n.actor.username} commented on your post`;
      case "REPOST": return `@${n.actor.username} reposted you`;
      case "MESSAGE": return `New message from @${n.actor.username}`;
      case "FOLLOW": return `@${n.actor.username} followed you`;
      default: return `Activity from @${n.actor.username}`;
    }
  };

  return (
    <Layout user={session?.user ? {
      id: (session.user as any).id,
      username: (session.user as any).username || "",
      isVerified: (session.user as any).isVerified || false,
    } : null}>
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Notifications</h2>
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="outline" onClick={load} disabled={loading}>{loading ? "Loading…" : "Refresh"}</Button>
            <Button size="sm" onClick={markAllRead}>Mark all read</Button>
          </div>
        </div>

        <div className="card">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notifications yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {items.map(n => (
                <div key={n.id} className={`px-4 py-3 ${n.read ? "opacity-70" : ""}`}>
                  <div className="text-sm">{label(n)}</div>
                  <div className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

