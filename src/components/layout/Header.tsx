"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Home, 
  Search, 
  Bell, 
  MessageCircle, 
  User, 
  Settings,
  Wallet,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWallet } from "@/contexts/WalletContext";
import { useSession, signOut } from "next-auth/react";
import { playNotificationSound } from "@/lib/sounds";
import { usePathname } from "next/navigation";

interface HeaderProps {
  user?: {
    id: string;
    username: string;
    walletAddress?: string;
    isVerified: boolean;
    profileImage?: string;
  } | null;
}

export default function Header({ user }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [walletUserId, setWalletUserId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [prevUnreadCount, setPrevUnreadCount] = useState<number | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { connected, publicKey, disconnect } = useWallet();
  const { data: session } = useSession();
  
  // Clear unread count when on notifications page
  const isOnNotificationsPage = pathname === "/notifications" || pathname?.startsWith("/notifications");

  // Track the baseline count - when user visits notifications, we remember that count
  // Badge only shows NEW notifications that arrived AFTER they left
  const [baselineCount, setBaselineCount] = useState<number | null>(null);
  
  useEffect(() => {
    if (isOnNotificationsPage) {
      // User is on notifications page - immediately fetch and set baseline
      const fetchAndSetBaseline = async () => {
        const headers: Record<string, string> = {};
        if (!session?.user && connected && publicKey) {
          headers["X-Wallet-Address"] = publicKey.toBase58();
        }
        
        if (session?.user?.id || (connected && publicKey)) {
          try {
            const res = await fetch("/api/notifications", { headers });
            if (res.ok) {
              const data = await res.json();
              const currentUnread = (data.notifications || []).filter((n: any) => !n.read).length;
              setBaselineCount(currentUnread);
            }
          } catch (e) {
            // Silent fail
          }
        }
      };
      fetchAndSetBaseline();
    }
    // Don't reset baseline when navigating away - keep it!
  }, [isOnNotificationsPage, session, connected, publicKey]);

  // Fetch user ID for wallet-only users
  useEffect(() => {
    if (connected && publicKey && !user?.id) {
      fetch(`/api/users/byWallet?address=${publicKey.toBase58()}`)
        .then(res => res.json())
        .then(data => {
          if (data.user?.id) {
            setWalletUserId(data.user.id);
          }
        })
        .catch(() => {});
    }
  }, [connected, publicKey, user?.id]);

  // Poll for unread notifications
  useEffect(() => {
    const fetchUnreadCount = async () => {
      const headers: Record<string, string> = {};
      if (!session?.user && connected && publicKey) {
        headers["X-Wallet-Address"] = publicKey.toBase58();
      }
      
      if (session?.user?.id || (connected && publicKey)) {
        try {
          const res = await fetch("/api/notifications", { headers });
          if (res.ok) {
            const data = await res.json();
            const unread = (data.notifications || []).filter((n: any) => !n.read).length;
            
            // Play sound if new notifications arrived
            // Only play if we had a previous count (not initial load) and count increased
            if (prevUnreadCount !== null && unread > prevUnreadCount) {
              // Only play if we're not currently on the notifications page
              if (!isOnNotificationsPage) {
                playNotificationSound('notification');
              }
            }
            
            setPrevUnreadCount(unread);
            setUnreadCount(unread);
            
            // Update baseline count when on notifications page (to handle when they mark as read while viewing)
            // This keeps baseline in sync with current count while viewing
            if (isOnNotificationsPage) {
              setBaselineCount(unread);
            }
          }
        } catch (e) {
          // Silent fail
        }
      }
    };

    // Always fetch when pathname changes (to update count after marking as read)
    fetchUnreadCount();
    
    // Poll every 5 seconds
    const interval = setInterval(fetchUnreadCount, 5000);
    return () => clearInterval(interval);
  }, [session, connected, publicKey, pathname, isOnNotificationsPage]); // Refresh when pathname changes

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/search", icon: Search, label: "Search" },
    { href: "/notifications", icon: Bell, label: "Notifications" },
    { href: "/messages", icon: MessageCircle, label: "Messages" },
  ];

  const handleLogout = async () => {
    if (session) {
      await signOut({ callbackUrl: "/auth/login" });
    } else if (connected) {
      disconnect();
      router.push("/auth/login");
    } else {
      router.push("/auth/login");
    }
  };

  const handleProfileClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (user?.id) {
      router.push(`/profile/${user.id}`);
      setIsMenuOpen(false);
      return;
    }
    if (walletUserId) {
      router.push(`/profile/${walletUserId}`);
      setIsMenuOpen(false);
      return;
    }
    if (connected && publicKey) {
      try {
        const res = await fetch(`/api/users/byWallet?address=${publicKey.toBase58()}`);
        if (res.ok) {
          const data = await res.json();
          router.push(`/profile/${data.user.id}`);
        }
      } catch {}
    }
    setIsMenuOpen(false);
  };

  // Determine if we should show user menu (has session OR wallet connected)
  const showUserMenu = !!(user || (connected && publicKey));

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-degen-purple to-degen-pink flex items-center justify-center">
              <span className="text-white font-bold text-lg">D</span>
            </div>
            <span className="text-xl font-bold gradient-text">DegenHub</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const isNotifications = item.href === "/notifications";
              
              // Show badge logic:
              // 1. Always hide if on notifications page
              // 2. If baseline is set (user visited notifications), only show if NEW notifications arrived
              // 3. If baseline not set yet, show all unread (first time user)
              let showBadge = false;
              
              if (isNotifications) {
                if (isOnNotificationsPage) {
                  // On notifications page - never show badge
                  showBadge = false;
                } else {
                  // Not on notifications page
                  if (baselineCount === null) {
                    // Never visited notifications page - show all unread
                    showBadge = unreadCount > 0;
                  } else {
                    // User HAS visited notifications - only show if NEW ones arrived
                    showBadge = unreadCount > baselineCount;
                  }
                }
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors relative"
                >
                  <div className="relative">
                    <item.icon className="h-5 w-5" />
                    {showBadge && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {(() => {
                          // Show only the NEW notifications count (difference from baseline)
                          if (baselineCount !== null && unreadCount > baselineCount) {
                            const newCount = unreadCount - baselineCount;
                            return newCount > 99 ? "99+" : newCount;
                          }
                          return unreadCount > 99 ? "99+" : unreadCount;
                        })()}
                      </span>
                    )}
                  </div>
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {showUserMenu ? (
              <div className="flex items-center space-x-4">
                {/* Wallet Connection Status */}
                {(user?.walletAddress || (connected && publicKey)) && (
                  <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-sm border border-green-500/20">
                    <Wallet className="h-4 w-4" />
                    <span className="text-xs">
                      {(user?.walletAddress || publicKey?.toBase58() || "").slice(0, 4)}...{(user?.walletAddress || publicKey?.toBase58() || "").slice(-4)}
                    </span>
                  </div>
                )}

                {/* User Avatar & Menu */}
                <div className="relative">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-accent transition-colors border border-border"
                  >
                    {user?.profileImage ? (
                      <img
                        src={user.profileImage}
                        alt={user.username}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gradient-to-r from-degen-purple to-degen-pink flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {(user?.username || (connected && publicKey ? publicKey.toBase58().slice(0, 1) : "U")).charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    {user?.isVerified && (
                      <div className="h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg py-2 z-50">
                      <button
                        onClick={handleProfileClick}
                        className="flex items-center space-x-2 px-4 py-2 hover:bg-accent transition-colors w-full text-left"
                      >
                        <User className="h-4 w-4" />
                        <span>Profile</span>
                      </button>
                      {user?.id && (
                        <Link
                          href="/settings"
                          className="flex items-center space-x-2 px-4 py-2 hover:bg-accent transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <Settings className="h-4 w-4" />
                          <span>Settings</span>
                        </Link>
                      )}
                      <hr className="my-2 border-border" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 px-4 py-2 text-red-500 hover:bg-red-500/10 transition-colors w-full text-left"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>{connected && !session ? "Disconnect" : "Logout"}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth/login" className="btn-secondary">Login</Link>
                <Link href="/auth/signup" className="btn-primary">Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

