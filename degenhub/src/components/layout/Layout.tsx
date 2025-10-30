"use client";

import { ReactNode } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";

interface LayoutProps {
  children: ReactNode;
  user?: {
    id: string;
    username: string;
    walletAddress?: string;
    isVerified: boolean;
  } | null;
}

export default function Layout({ children, user }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 lg:ml-0">
          <div className="container mx-auto px-4 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

