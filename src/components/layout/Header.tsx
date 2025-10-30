"use client";

import { useState } from "react";
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

interface HeaderProps {
  user?: {
    id: string;
    username: string;
    walletAddress?: string;
    isVerified: boolean;
  } | null;
}

export default function Header({ user }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/search", icon: Search, label: "Search" },
    { href: "/notifications", icon: Bell, label: "Notifications" },
    { href: "/messages", icon: MessageCircle, label: "Messages" },
  ];

  const handleLogout = () => {
    // TODO: Implement logout logic
    router.push("/auth/login");
  };

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
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <item.icon className="h-5 w-5" />
                <span className="hidden lg:inline">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                {/* Wallet Connection Status */}
                {user.walletAddress && (
                  <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-sm">
                    <Wallet className="h-4 w-4" />
                    <span className="text-xs">
                      {user.walletAddress.slice(0, 4)}...{user.walletAddress.slice(-4)}
                    </span>
                  </div>
                )}

                {/* User Avatar & Menu */}
                <div className="relative">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-degen-purple to-degen-pink flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    {user.isVerified && (
                      <div className="h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg py-2 z-50">
                      <Link
                        href={`/profile/${user.id}`}
                        className="flex items-center space-x-2 px-4 py-2 hover:bg-accent transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center space-x-2 px-4 py-2 hover:bg-accent transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                      <hr className="my-2 border-border" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 px-4 py-2 text-red-500 hover:bg-red-500/10 transition-colors w-full text-left"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/auth/login"
                  className="btn-secondary"
                >
                  Login
                </Link>
                <Link
                  href="/auth/signup"
                  className="btn-primary"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

