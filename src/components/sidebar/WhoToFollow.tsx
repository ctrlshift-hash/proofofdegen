"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useWallet } from "@/contexts/WalletContext";
import { Button } from "@/components/ui/Button";
import { UserPlus, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import UserHoverCard from "@/components/users/UserHoverCard";

interface SuggestedUser {
  id: string;
  username: string;
  bio?: string;
  profileImage?: string;
  isVerified: boolean;
  walletAddress?: string;
  followersCount: number;
  postsCount: number;
  isFollowing: boolean;
}

export default function WhoToFollow() {
  const { data: session } = useSession();
  const { connected, publicKey } = useWallet();
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({});

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      const headers: Record<string, string> = {};
      if (!session?.user && connected && publicKey) {
        headers["X-Wallet-Address"] = publicKey.toBase58();
      }

      const res = await fetch("/api/users/suggestions", { headers });
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions || []);
        // Initialize following states
        const states: Record<string, boolean> = {};
        (data.suggestions || []).forEach((user: SuggestedUser) => {
          states[user.id] = user.isFollowing;
        });
        setFollowingStates(states);
      }
    } catch (error) {
      console.error("Failed to load suggestions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId: string, username: string) => {
    try {
      const headers: Record<string, string> = {};
      if (!session?.user && connected && publicKey) {
        headers["X-Wallet-Address"] = publicKey.toBase58();
      }

      const isCurrentlyFollowing = followingStates[userId];
      const endpoint = `/api/users/${userId}/follow`;

      if (isCurrentlyFollowing) {
        // Unfollow
        const res = await fetch(endpoint, {
          method: "DELETE",
          headers,
        });
        if (res.ok) {
          setFollowingStates({ ...followingStates, [userId]: false });
        }
      } else {
        // Follow
        const res = await fetch(endpoint, {
          method: "POST",
          headers,
        });
        if (res.ok) {
          setFollowingStates({ ...followingStates, [userId]: true });
        }
      }
    } catch (error) {
      console.error("Failed to toggle follow:", error);
    }
  };

  useEffect(() => {
    loadSuggestions();
    // Refresh suggestions every 30 seconds to rotate users
    const interval = setInterval(loadSuggestions, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, connected, publicKey]);

  if (!session?.user && !connected) {
    return null; // Don't show if not logged in
  }

  if (loading) {
    return (
      <div className="bg-card rounded-lg border border-border p-4">
        <h3 className="text-lg font-bold mb-4">Who to follow</h3>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <h3 className="text-lg font-bold mb-4">Who to follow</h3>
      <div className="space-y-4">
        {suggestions.map((user) => {
          const isFollowing = followingStates[user.id] || false;
          return (
            <div key={user.id} className="flex items-start gap-3">
              {/* Avatar */}
              <UserHoverCard userId={user.id} username={user.username}>
              <Link href={`/profile/${user.id}`} className="flex-shrink-0">
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-degen-purple to-degen-pink flex items-center justify-center text-white font-bold">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </Link>
              </UserHoverCard>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <UserHoverCard userId={user.id} username={user.username}>
                <Link href={`/profile/${user.id}`} className="block hover:underline">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-semibold text-sm truncate">{user.username}</span>
                    {(user as any).isGoldVerified ? (
                      <span className="inline-flex items-center gap-1">
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-yellow-400 text-black">
                          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.004 7.004a1 1 0 01-1.414 0L3.293 9.714a1 1 0 111.414-1.414l3.004 3.004 6.297-6.297a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                        </span>
                        {user.username === "Alon" && (
                          <img src="https://static.wixstatic.com/media/e2da02_248e6293fa024f6e9dd4130271bb14c3~mv2.png" alt="pill" className="w-3.5 h-3.5" />
                        )}
                      </span>
                    ) : ((user.walletAddress || (user as any).email) && (
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-500 text-white">
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.004 7.004a1 1 0 01-1.414 0L3.293 9.714a1 1 0 111.414-1.414l3.004 3.004 6.297-6.297a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                      </span>
                    ))}
                  </div>
                  {user.bio && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{user.bio}</p>
                  )}
                </Link>
                </UserHoverCard>
              </div>

              {/* Follow Button */}
              <Button
                onClick={() => handleFollow(user.id, user.username)}
                size="sm"
                className={`flex-shrink-0 h-8 px-4 text-xs ${isFollowing ? 'pill-btn' : 'pill-btn-primary'}`}
              >
                {isFollowing ? (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Following
                  </>
                ) : (
                  <>
                    <UserPlus className="h-3 w-3 mr-1" />
                    Follow
                  </>
                )}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

