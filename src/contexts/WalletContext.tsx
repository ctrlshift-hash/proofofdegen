"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { ConnectionProvider, WalletProvider, useWallet as useAdapterWallet } from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { Connection, PublicKey } from "@solana/web3.js";
import { useSession } from "next-auth/react";

// CSS will be imported in the layout

interface WalletContextType {
  connection: Connection | null;
  publicKey: PublicKey | null;
  connected: boolean;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletContextProvider({ children }: WalletProviderProps) {
  const [connection, setConnection] = useState<Connection | null>(null);
  // These will be populated via the adapter bridge below
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const { data: session } = useSession(); // get current user session

  // Use mainnet for real wallets - Helius prioritized
  const network = WalletAdapterNetwork.Mainnet;
  const endpoint = process.env.NEXT_PUBLIC_HELIUS_RPC_URL ||
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
    "https://api.mainnet-beta.solana.com";

  const wallets = [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ];

  useEffect(() => {
    const conn = new Connection(endpoint, "confirmed");
    setConnection(conn);
  }, [endpoint]);

  useEffect(() => {
    // Sync wallet to backend when connected
    // Works for both email-authenticated users and wallet-only users
    async function syncWalletToProfile() {
      if (connected && publicKey) {
        try {
          const walletAddr = publicKey.toBase58();
          
          if (session?.user?.id) {
            // Email-authenticated user - update existing account
            await fetch("/api/auth/updateWallet", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ walletAddress: walletAddr }),
            });
          } else {
            // Wallet-only user - ensure user exists with wallet address
            // This creates or updates the user via byWallet endpoint
            await fetch(`/api/users/byWallet?address=${encodeURIComponent(walletAddr)}`);
          }
        } catch (error) {
          console.error("Failed to sync wallet address to backend:", error);
        }
      }
    }
    syncWalletToProfile();
  }, [connected, publicKey, session]);

  const connect = async () => {};

  const disconnect = async () => {
    try {
      setPublicKey(null);
      setConnected(false);
      console.log("Wallet disconnected");
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
    }
  };

  // Bridge component to read adapter wallet state and expose it via our context
  function WalletStateBridge({ children }: { children: ReactNode }) {
    const adapter = useAdapterWallet();

    useEffect(() => {
      setConnected(adapter.connected);
      // Adapter publicKey is a `PublicKey | null`
      setPublicKey(adapter.publicKey ?? null);
      setConnecting(adapter.connecting ?? false as boolean);
    }, [adapter.connected, adapter.publicKey, adapter.connecting]);

    const value: WalletContextType = {
      connection,
      publicKey,
      connected,
      connecting,
      connect: adapter.connect,
      disconnect: adapter.disconnect,
    };

    return (
      <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
    );
  }

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <WalletStateBridge>{children}</WalletStateBridge>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

