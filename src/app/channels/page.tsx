"use client";

import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/Button";
import { 
  Hash, 
  Lock, 
  Users, 
  Plus,
  Search,
  Filter,
  TrendingUp
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useWallet } from "@/contexts/WalletContext";

interface ChannelItem {
  id: string;
  name: string;
  description?: string | null;
  memberCount: number;
  isTokenGated: boolean;
  tokenAddress?: string | null;
  minBalance?: any | null;
  isJoined: boolean;
  isOwner: boolean;
  category: string;
  trending: boolean;
}

export default function ChannelsPage() {
  const { data: session } = useSession();
  const { connected, publicKey } = useWallet();
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("trending");

  const categories = ["All", "General", "Token-Gated", "Development"]; // Development kept for future

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/channels");
      if (res.ok) {
        const data = await res.json();
        setChannels(data.channels || []);
      }
    } catch (e) {
      console.error("Failed to load channels", e);
    } finally {
      setLoading(false);
    }
  };

  const createChannel = async () => {
    const name = window.prompt("Channel name (min 3 chars)")?.trim();
    if (!name) return;
    const description = window.prompt("Description (optional)")?.trim() || undefined;
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (!session?.user && connected && publicKey) headers["X-Wallet-Address"] = publicKey.toBase58();
      const res = await fetch("/api/channels", { method: "POST", headers, body: JSON.stringify({ name, description }) });
      if (res.ok) {
        await load();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create channel");
      }
    } catch (e) {
      console.error("Create channel failed", e);
    }
  };

  useEffect(() => { load(); }, []);

  const filteredChannels = channels.filter(channel => {
    const matchesSearch = channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (channel.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || channel.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedChannels = [...filteredChannels].sort((a, b) => {
    switch (sortBy) {
      case "trending":
        return (b.trending ? 1 : 0) - (a.trending ? 1 : 0);
      case "members":
        return b.memberCount - a.memberCount;
      case "name":
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const handleJoinChannel = async (channelId: string) => {
    try {
      const headers: Record<string, string> = {};
      if (!session?.user && connected && publicKey) headers["X-Wallet-Address"] = publicKey.toBase58();
      const res = await fetch(`/api/channels/${channelId}/join`, { method: "POST", headers });
      if (res.ok) {
        setChannels(prev => prev.map(c => c.id === channelId ? { ...c, isJoined: true, memberCount: c.memberCount + 1 } : c));
      }
    } catch (e) {
      console.error("Join channel failed", e);
    }
  };

  const handleLeaveChannel = async (channelId: string) => {
    try {
      const headers: Record<string, string> = {};
      if (!session?.user && connected && publicKey) headers["X-Wallet-Address"] = publicKey.toBase58();
      const res = await fetch(`/api/channels/${channelId}/leave`, { method: "POST", headers });
      if (res.ok) {
        setChannels(prev => prev.map(c => c.id === channelId ? { ...c, isJoined: false, memberCount: Math.max(0, c.memberCount - 1) } : c));
      }
    } catch (e) {
      console.error("Leave channel failed", e);
    }
  };

  const formatBalance = (balance: number) => {
    if (balance >= 1000000) return `${(balance / 1000000).toFixed(1)}M`;
    if (balance >= 1000) return `${(balance / 1000).toFixed(1)}K`;
    return balance.toString();
  };

  return (
    <Layout user={session?.user ? {
      id: (session.user as any).id,
      username: (session.user as any).username || "",
      isVerified: (session.user as any).isVerified || false,
    } : null}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold">Channels</h1>
            <p className="text-muted-foreground">Join communities and access exclusive token-gated channels</p>
          </div>
          <Button className="btn-primary" onClick={createChannel}>
            <Plus className="h-4 w-4 mr-2" />
            Create Channel
          </Button>
        </div>

        <div className="card">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="text" placeholder="Search channels..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="input pl-10 w-full sm:w-64" />
              </div>
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="input w-full sm:w-48">
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input w-32">
                <option value="trending">Trending</option>
                <option value="members">Members</option>
                <option value="name">Name</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedChannels.map((channel) => (
            <div key={channel.id} className="card hover:bg-card/50 transition-colors cursor-pointer" onClick={() => window.location.assign(`/channels/${channel.id}`)}>
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-degen-purple to-degen-pink flex items-center justify-center">
                      <Hash className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold flex items-center space-x-1">
                        <span>{channel.name}</span>
                        {channel.trending && (<TrendingUp className="h-4 w-4 text-degen-orange" />)}
                      </h3>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <span className="px-2 py-1 bg-muted rounded-full text-xs">{channel.category}</span>
                        {channel.isTokenGated && (
                          <div className="flex items-center space-x-1 text-degen-purple">
                            <Lock className="h-3 w-3" />
                            <span className="text-xs">Token-Gated</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2">{channel.description}</p>

                {channel.isTokenGated && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-sm font-medium mb-1">Token Requirements</div>
                    {channel.minBalance ? (
                      <div className="text-xs text-muted-foreground">Minimum: {formatBalance(Number(channel.minBalance))} tokens</div>
                    ) : null}
                    {channel.tokenAddress && (
                      <div className="text-xs text-muted-foreground font-mono">{channel.tokenAddress.slice(0, 8)}...{channel.tokenAddress.slice(-8)}</div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{channel.memberCount.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {channel.isJoined ? (
                      <Button onClick={() => handleLeaveChannel(channel.id)} variant="outline" size="sm">Leave</Button>
                    ) : (
                      <Button onClick={() => handleJoinChannel(channel.id)} size="sm">Join</Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {sortedChannels.length === 0 && (
          <div className="text-center py-12">
            <Hash className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No channels found</h3>
            <p className="text-muted-foreground mb-4">Try adjusting your search or filter criteria</p>
            <Button onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }}>Clear Filters</Button>
          </div>
        )}
      </div>
    </Layout>
  );
}

