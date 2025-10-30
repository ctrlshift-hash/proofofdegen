"use client";

import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/Button";
import { 
  Hash, 
  Lock, 
  Users, 
  Plus,
  Search,
  Filter,
  Star,
  TrendingUp
} from "lucide-react";

// Mock channels data
const mockChannels = [
  {
    id: "1",
    name: "Solana Degens",
    description: "The ultimate community for Solana enthusiasts and DeFi degens",
    memberCount: 15420,
    isTokenGated: false,
    isJoined: true,
    isOwner: false,
    category: "General",
    trending: true,
  },
  {
    id: "2",
    name: "$BONK Maxxers",
    description: "Exclusive channel for $BONK holders. Minimum 1M $BONK required.",
    memberCount: 8923,
    isTokenGated: true,
    tokenAddress: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    minBalance: 1000000,
    isJoined: false,
    isOwner: false,
    category: "Token-Gated",
    trending: true,
  },
  {
    id: "3",
    name: "DeFi Builders",
    description: "For developers and builders in the DeFi space",
    memberCount: 5678,
    isTokenGated: false,
    isJoined: true,
    isOwner: false,
    category: "Development",
    trending: false,
  },
  {
    id: "4",
    name: "$RAY Holders",
    description: "Exclusive for $RAY token holders. Minimum 100 $RAY required.",
    memberCount: 3421,
    isTokenGated: true,
    tokenAddress: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
    minBalance: 100,
    isJoined: false,
    isOwner: false,
    category: "Token-Gated",
    trending: false,
  },
  {
    id: "5",
    name: "NFT Alpha",
    description: "Exclusive NFT alpha and early project announcements",
    memberCount: 1234,
    isTokenGated: true,
    tokenAddress: "So11111111111111111111111111111111111111112",
    minBalance: 1,
    isJoined: false,
    isOwner: true,
    category: "Token-Gated",
    trending: false,
  },
];

// Mock current user
const currentUser = {
  id: "current-user",
  username: "degenuser",
  walletAddress: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
  isVerified: true,
};

export default function ChannelsPage() {
  const [channels, setChannels] = useState(mockChannels);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("trending");

  const categories = ["All", "General", "Token-Gated", "Development"];

  const filteredChannels = channels.filter(channel => {
    const matchesSearch = channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         channel.description.toLowerCase().includes(searchQuery.toLowerCase());
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

  const handleJoinChannel = (channelId: string) => {
    setChannels(prev => prev.map(channel => {
      if (channel.id === channelId) {
        return { ...channel, isJoined: true };
      }
      return channel;
    }));
  };

  const handleLeaveChannel = (channelId: string) => {
    setChannels(prev => prev.map(channel => {
      if (channel.id === channelId) {
        return { ...channel, isJoined: false };
      }
      return channel;
    }));
  };

  const formatBalance = (balance: number) => {
    if (balance >= 1000000) {
      return `${(balance / 1000000).toFixed(1)}M`;
    }
    if (balance >= 1000) {
      return `${(balance / 1000).toFixed(1)}K`;
    }
    return balance.toString();
  };

  return (
    <Layout user={currentUser}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold">Channels</h1>
            <p className="text-muted-foreground">
              Join communities and access exclusive token-gated channels
            </p>
          </div>
          <Button className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Create Channel
          </Button>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search channels..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-10 w-full sm:w-64"
                />
              </div>
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input w-full sm:w-48"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input w-32"
              >
                <option value="trending">Trending</option>
                <option value="members">Members</option>
                <option value="name">Name</option>
              </select>
            </div>
          </div>
        </div>

        {/* Channels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedChannels.map((channel) => (
            <div key={channel.id} className="card hover:bg-card/50 transition-colors">
              <div className="space-y-4">
                {/* Channel Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-degen-purple to-degen-pink flex items-center justify-center">
                      <Hash className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold flex items-center space-x-1">
                        <span>{channel.name}</span>
                        {channel.trending && (
                          <TrendingUp className="h-4 w-4 text-degen-orange" />
                        )}
                      </h3>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <span className="px-2 py-1 bg-muted rounded-full text-xs">
                          {channel.category}
                        </span>
                        {channel.isTokenGated && (
                          <div className="flex items-center space-x-1 text-degen-purple">
                            <Lock className="h-3 w-3" />
                            <span className="text-xs">Token-Gated</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {channel.isOwner && (
                    <div className="px-2 py-1 bg-degen-purple/10 text-degen-purple rounded-full text-xs font-medium">
                      Owner
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {channel.description}
                </p>

                {/* Token Requirements */}
                {channel.isTokenGated && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-sm font-medium mb-1">Token Requirements</div>
                    <div className="text-xs text-muted-foreground">
                      Minimum: {formatBalance(channel.minBalance!)} tokens
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {channel.tokenAddress?.slice(0, 8)}...{channel.tokenAddress?.slice(-8)}
                    </div>
                  </div>
                )}

                {/* Stats and Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{channel.memberCount.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {channel.isJoined ? (
                      <Button
                        onClick={() => handleLeaveChannel(channel.id)}
                        variant="outline"
                        size="sm"
                      >
                        Leave
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleJoinChannel(channel.id)}
                        size="sm"
                        disabled={channel.isTokenGated && !currentUser.walletAddress}
                      >
                        {channel.isTokenGated ? "Join (Verify)" : "Join"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {sortedChannels.length === 0 && (
          <div className="text-center py-12">
            <Hash className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No channels found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search or filter criteria
            </p>
            <Button onClick={() => {
              setSearchQuery("");
              setSelectedCategory("All");
            }}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}

