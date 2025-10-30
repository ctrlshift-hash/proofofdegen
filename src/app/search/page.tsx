"use client";

import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Search as SearchIcon, MessageCircle } from "lucide-react";

interface UserItem { id: string; username: string; profileImage?: string | null; isVerified: boolean }

export default function SearchPage() {
  const { data: session } = useSession();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<UserItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [copiedUser, setCopiedUser] = useState<string>("");

  const doSearch = async (query: string) => {
    const term = query.trim();
    if (!term) { setResults([]); return; }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.users || []);
      }
    } catch (e) {
      console.error("Search failed", e);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => doSearch(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <Layout user={session?.user ? {
      id: (session.user as any).id,
      username: (session.user as any).username || "",
      isVerified: (session.user as any).isVerified || false,
    } : null}>
      <div className="max-w-2xl mx-auto w-full">
        <div className="card">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search users by username..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
        </div>

        <div className="card mt-4">
          <h2 className="text-lg font-semibold mb-3">Results</h2>
          {isSearching ? (
            <p className="text-sm text-muted-foreground">Searching…</p>
          ) : results.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users found</p>
          ) : (
            <div className="space-y-2">
              {results.map(u => (
                <div key={u.id} className="flex items-center justify-between px-2 py-2 rounded-md hover:bg-muted/50">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white flex items-center justify-center text-sm">
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="font-medium">@{u.username}</div>
                    <button
                      className="text-xs px-2 py-0.5 rounded bg-muted hover:bg-muted/80 transition-colors"
                      onClick={async () => { try { await navigator.clipboard.writeText(u.username); setCopiedUser(u.id); setTimeout(() => setCopiedUser(""), 1200);} catch{} }}
                      title="Copy username"
                    >
                      {copiedUser === u.id ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link href={`/profile/${u.id}`}>
                      <Button size="sm" variant="outline">View</Button>
                    </Link>
                    <Link href={`/messages?to=${encodeURIComponent(u.username)}`}>
                      <Button size="sm"><MessageCircle className="h-4 w-4 mr-1" /> DM</Button>
                    </Link>
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
