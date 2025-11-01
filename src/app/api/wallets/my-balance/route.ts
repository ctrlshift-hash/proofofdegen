import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const USDT_MINT = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";
const MEMECOIN_MINTS: Record<string, string> = {
  BONK: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
  WIF: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
  POPCAT: "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr",
  MYRO: "Fm9rHUTF5v3hwMLbStjZXqNBBoZyGriQaFM6sTFz3a8p",
  BOME: "ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82",
};

// Prioritize Helius (much higher rate limits), then check NEXT_PUBLIC_SOLANA_RPC_URL, then default
const SOLANA_RPC = process.env.HELIUS_RPC_URL || 
  process.env.NEXT_PUBLIC_HELIUS_RPC_URL ||
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
  (process.env.NEXT_PUBLIC_SOLANA_NETWORK === "devnet" 
    ? "https://api.devnet.solana.com" 
    : "https://api.mainnet-beta.solana.com");

async function getTokenBalance(connection: Connection, walletAddress: string, tokenMint: string): Promise<number> {
  try {
    const pubkey = new PublicKey(walletAddress);
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pubkey, {
      mint: new PublicKey(tokenMint),
    });
    
    if (tokenAccounts.value.length === 0) return 0;
    
    return tokenAccounts.value.reduce((sum, account) => {
      const parsedInfo = account.account.data.parsed.info;
      return sum + parseFloat(parsedInfo.tokenAmount.uiAmountString || "0");
    }, 0);
  } catch (error) {
    return 0;
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("address");

    // Get wallet from session, query param, or find user
    let targetWallet: string | null = null;

    if (walletAddress) {
      targetWallet = walletAddress;
    } else if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { walletAddress: true },
      });
      targetWallet = user?.walletAddress || null;
    }

    if (!targetWallet) {
      return NextResponse.json(
        { error: "No wallet address found. Connect your wallet first." },
        { status: 400 }
      );
    }

    const connection = new Connection(SOLANA_RPC, "confirmed");
    
    // Fetch balances
    const pubkey = new PublicKey(targetWallet);
    const solBalanceLamports = await connection.getBalance(pubkey);
    const solBalance = solBalanceLamports / LAMPORTS_PER_SOL;
    
    const usdtBalance = await getTokenBalance(connection, targetWallet, USDT_MINT);
    
    const memecoins = [];
    for (const [symbol, mint] of Object.entries(MEMECOIN_MINTS)) {
      const balance = await getTokenBalance(connection, targetWallet, mint);
      if (balance > 0) {
        memecoins.push({
          symbol,
          balance,
          value: 0,
        });
      }
    }

    const estimatedSOLValue = solBalance * 150;
    const totalValue = estimatedSOLValue + usdtBalance;

    return NextResponse.json({
      walletAddress: targetWallet,
      solBalance,
      usdtBalance,
      memecoins,
      totalValue,
    });
  } catch (error: any) {
    console.error("My balance error:", error);
    return NextResponse.json(
      { error: "Failed to fetch balance", detail: error.message },
      { status: 500 }
    );
  }
}

