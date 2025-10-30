"use client";

import { useState } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/Button";
import { Loader2, Wallet, CheckCircle } from "lucide-react";

export default function WalletConnect() {
  const { connected, connecting, connect, disconnect } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connect();
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  if (connected) {
    return (
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-2 px-3 py-2 bg-green-500/10 text-green-500 rounded-lg">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Wallet Connected</span>
        </div>
        <Button
          onClick={disconnect}
          variant="outline"
          size="sm"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <Wallet className="h-12 w-12 mx-auto text-degen-purple mb-4" />
        <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
        <p className="text-muted-foreground text-sm mb-6">
          Connect your Solana wallet to access all features and verify your identity
        </p>
      </div>

      <div className="space-y-3">
        <WalletMultiButton className="w-full" />
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <Button
          onClick={handleConnect}
          disabled={connecting || isConnecting}
          className="w-full"
        >
          {(connecting || isConnecting) && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Connect Wallet
        </Button>
      </div>

      <div className="text-xs text-muted-foreground text-center">
        <p>Supported wallets: Phantom, Solflare</p>
        <p className="mt-1">
          By connecting, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
}

