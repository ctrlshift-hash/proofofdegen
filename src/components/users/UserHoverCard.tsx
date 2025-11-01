"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useWallet } from "@/contexts/WalletContext";
import { isGoldVerified } from "@/lib/gold-verified";

type HoverUser = {
  id: string;
  username: string;
  bio?: string | null;
  profileImage?: string | null;
  isVerified: boolean;
  walletAddress?: string | null;
  followersCount?: number;
  followingCount?: number;
  email?: string | null;
};

interface UserHoverCardProps {
  userId: string;
  username?: string;
  children: React.ReactNode;
}

export default function UserHoverCard({ userId, username, children }: UserHoverCardProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<HoverUser | null>(null);
  const [following, setFollowing] = useState(false);
  const anchorRef = useRef<HTMLSpanElement | null>(null);
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const { data: session } = useSession();
  const { connected, publicKey } = useWallet();

  // Fetch on first open
  useEffect(() => {
    if (!open || user) return;
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/users/${userId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setUser({
            id: data.user.id,
            username: data.user.username,
            bio: data.user.bio,
            profileImage: data.user.profileImage,
            isVerified: !!(data.user.walletAddress || data.user.email),
            walletAddress: data.user.walletAddress,
            followersCount: data.followerCount,
            followingCount: data.followingCount,
            email: data.user.email,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [open, user, userId]);

  const toggleFollow = async () => {
    try {
      const headers: Record<string, string> = {};
      if (!session?.user && connected && publicKey) {
        headers["X-Wallet-Address"] = publicKey.toBase58();
      }
      const endpoint = `/api/users/${userId}/follow`;
      if (following) {
        const res = await fetch(endpoint, { method: "DELETE", headers });
        if (res.ok) setFollowing(false);
      } else {
        const res = await fetch(endpoint, { method: "POST", headers });
        if (res.ok) setFollowing(true);
      }
    } catch {}
  };

  const onEnter = () => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setCoords({ x: rect.left, y: rect.bottom + 8 });
    setOpen(true);
  };
  const onLeave = () => setOpen(false);

  return (
    <span
      ref={anchorRef}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className="inline-block"
    >
      {children}
      {open && createPortal(
        <div
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={onLeave}
          className="fixed z-50 w-96 rounded-2xl border border-gray-700 bg-gray-900 text-gray-100 shadow-2xl animate-pop-in"
          style={{ left: Math.max(8, coords.x), top: coords.y }}
        >
          <div className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full overflow-hidden bg-gradient-to-r from-degen-purple to-degen-pink">
                {user?.profileImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.profileImage} alt={user.username} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Link href={`/profile/${userId}`} className="font-semibold hover:underline truncate">
                    {user?.username || username || "User"}
                  </Link>
                  {(user?.walletAddress || user?.email) && (
                    <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full ${isGoldVerified(user as any) ? "bg-yellow-400 text-black" : "bg-blue-500 text-white"}`}>
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.004 7.004a1 1 0 01-1.414 0L3.293 9.714a1 1 0 111.414-1.414l3.004 3.004 6.297-6.297a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                    </span>
                  )}
                  {user?.username === "Alon" && isGoldVerified(user as any) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src="https://static.wixstatic.com/media/e2da02_248e6293fa024f6e9dd4130271bb14c3~mv2.png" alt="pill" className="w-3.5 h-3.5" />
                  )}
                </div>
                {(user?.followersCount !== undefined || user?.followingCount !== undefined) && (
                  <div className="text-xs text-muted-foreground">
                    {user?.followingCount ?? 0} following · {user?.followersCount ?? 0} followers
                  </div>
                )}
              </div>
              <button
                onClick={toggleFollow}
                className="ml-auto pill-btn-primary text-xs"
              >
                {following ? "Following" : "Follow"}
              </button>
            </div>
            {/* Stats */}
            <div className="mt-3 flex items-center gap-6 text-sm">
              <div>
                <div className="text-xs text-gray-400">Following</div>
                <div className="font-semibold">{user?.followingCount ?? 0}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Followers</div>
                <div className="font-semibold">{user?.followersCount ?? 0}</div>
              </div>
            </div>

            <div className="mt-3 text-sm text-gray-300 line-clamp-4">
              {loading ? "Loading…" : (user?.bio || "No bio yet")}
            </div>
          </div>
        </div>,
        document.body
      )}
    </span>
  );
}


