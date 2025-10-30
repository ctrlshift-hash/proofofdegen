"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Search, 
  Bell, 
  MessageCircle, 
  User, 
  Settings,
  Hash,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/search", icon: Search, label: "Search" },
  { href: "/notifications", icon: Bell, label: "Notifications" },
  { href: "/messages", icon: MessageCircle, label: "Messages" },
  { href: "/channels", icon: Hash, label: "Channels" },
  { href: "/trending", icon: TrendingUp, label: "Trending" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:block w-64 h-screen border-r border-border bg-card">
      <div className="p-6">
        <div className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                  isActive
                    ? "bg-degen-purple/10 text-degen-purple border border-degen-purple/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Quick Stats
          </h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Active Users</span>
              <span className="text-degen-green">1,234</span>
            </div>
            <div className="flex justify-between">
              <span>Posts Today</span>
              <span className="text-degen-blue">567</span>
            </div>
            <div className="flex justify-between">
              <span>SOL Tipped</span>
              <span className="text-degen-purple">12.5</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

