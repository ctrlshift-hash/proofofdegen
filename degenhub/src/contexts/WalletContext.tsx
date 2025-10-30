"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { Connection, PublicKey } from "@solana/web3.js";

// Import wallet adapter CSS
require("@solana/wallet-adapter-react-ui/styles.css");

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
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const network = WalletAdapterNetwork.Devnet;
  const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";

  const wallets = [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ];

  useEffect(() => {
    const conn = new Connection(endpoint, "confirmed");
    setConnection(conn);
  }, [endpoint]);

  const connect = async () => {
    setConnecting(true);
    try {
      // This would be handled by the wallet adapter
      // For now, we'll simulate a connection
      console.log("Connecting wallet...");
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      setPublicKey(null);
      setConnected(false);
      console.log("Wallet disconnected");
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
    }
  };

  const value: WalletContextType = {
    connection,
    publicKey,
    connected,
    connecting,
    connect,
    disconnect,
  };

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <WalletContext.Provider value={value}>
            {children}
          </WalletContext.Provider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

