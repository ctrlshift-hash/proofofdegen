"use client";

import { useState } from "react";
import Link from "next/link";
import WalletConnect from "@/components/auth/WalletConnect";
import EmailAuth from "@/components/auth/EmailAuth";
import { Button } from "@/components/ui/Button";
import { Wallet, Mail } from "lucide-react";

type AuthMode = "wallet" | "email";

export default function SignupPage() {
  const [authMode, setAuthMode] = useState<AuthMode>("wallet");
  const [emailMode, setEmailMode] = useState<"login" | "register">("register");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-4">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center">
              <span className="text-white font-bold text-xl">D</span>
            </div>
            <span className="text-2xl font-bold gradient-text">DegenHub</span>
          </Link>
          <h1 className="text-2xl font-bold mb-2">Join DegenHub</h1>
          <p className="text-muted-foreground">
            Create your account to get started
          </p>
        </div>

        {/* Auth Method Toggle */}
        <div className="flex bg-muted rounded-lg p-1 mb-6">
          <button
            onClick={() => setAuthMode("wallet")}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${
              authMode === "wallet"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Wallet className="h-4 w-4" />
            <span className="font-medium">Wallet</span>
          </button>
          <button
            onClick={() => setAuthMode("email")}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${
              authMode === "email"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Mail className="h-4 w-4" />
            <span className="font-medium">Email</span>
          </button>
        </div>

        {/* Auth Content */}
        <div className="card">
          {authMode === "wallet" ? (
            <WalletConnect />
          ) : (
            <EmailAuth
              mode={emailMode}
              onSwitchMode={() => setEmailMode(emailMode === "login" ? "register" : "login")}
              onSubmit={async () => {}} // Not used anymore
            />
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>
            Already have an account?{" "}
            <Link href="/auth/login" className="text-purple-600 hover:underline">
              Sign in
            </Link>
          </p>
          <p className="mt-2">
            By continuing, you agree to our{" "}
            <Link href="/terms" className="text-purple-600 hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-purple-600 hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}