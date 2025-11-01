import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { FEATURED_WALLETS } from "@/lib/featured-wallets";

// USDT on Solana (mint address)
const USDT_MINT = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";
// Popular memecoins on Solana (add more as needed)
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

interface WalletBalance {
  walletAddress: string;
  userId: string;
  username: string;
  profileImage?: string;
  solBalance: number;
  usdtBalance: number;
  memecoins: Array<{
    symbol: string;
    balance: number;
    value: number; // USD value if available
  }>;
  totalValue: number; // Total portfolio value in USD (estimated)
}

async function getTokenBalance(
  connection: Connection,
  walletAddress: string,
  tokenMint: string,
  retries = 2
): Promise<number> {
  for (let i = 0; i < retries; i++) {
    try {
      const pubkey = new PublicKey(walletAddress);
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pubkey, {
        mint: new PublicKey(tokenMint),
      });
      
      if (tokenAccounts.value.length === 0) return 0;
      
      const balance = tokenAccounts.value.reduce((sum, account) => {
        const parsedInfo = account.account.data.parsed.info;
        return sum + parseFloat(parsedInfo.tokenAmount.uiAmountString || "0");
      }, 0);
      
      return balance;
    } catch (error: any) {
      if (error.message?.includes('429') || error.message?.includes('rate limit')) {
        const delay = (i + 1) * 1500;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      if (i === retries - 1) {
        // Silently fail for token balances to avoid spamming logs
        return 0;
      }
    }
  }
  return 0;
}

async function getSOLBalance(connection: Connection, walletAddress: string, retries = 3): Promise<number> {
  for (let i = 0; i < retries; i++) {
    try {
      const pubkey = new PublicKey(walletAddress);
      const balance = await connection.getBalance(pubkey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error: any) {
      if (error.message?.includes('429') || error.message?.includes('rate limit')) {
        // Rate limited - wait longer and retry
        const delay = (i + 1) * 2000; // 2s, 4s, 6s
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      if (i === retries - 1) {
        console.error("Error fetching SOL balance:", error);
        return 0;
      }
    }
  }
  return 0;
}

export async function GET(request: NextRequest) {
  try {
    // Log which RPC we're using for debugging
    console.log(`[Top Traders] Using RPC: ${SOLANA_RPC.includes('helius') ? 'HELIUS ✅' : 'PUBLIC RPC ⚠️'} (${SOLANA_RPC.substring(0, 50)}...)`);
    
    const connection = new Connection(SOLANA_RPC, "confirmed");
    
    // Get ALL users with wallet addresses (no filters except not null)
    const usersWithWallets = await prisma.user.findMany({
      where: {
        walletAddress: {
          not: null,
        },
      },
      select: {
        id: true,
        username: true,
        walletAddress: true,
        profileImage: true,
      },
      // Get all users, not just 100
    });

    // Merge in featured wallets not present in DB
    const featuredMerged = [...usersWithWallets];
    for (const f of FEATURED_WALLETS) {
      if (!featuredMerged.some(u => u.walletAddress?.toLowerCase() === f.address.toLowerCase())) {
        featuredMerged.push({ id: `featured_${f.address}`, username: f.label || f.address.slice(0,6), walletAddress: f.address, profileImage: null } as any);
      }
    }
    console.log(`Found ${usersWithWallets.length} users + ${FEATURED_WALLETS.length} featured = ${featuredMerged.length}`);

    if (usersWithWallets.length === 0) {
      return NextResponse.json({
        traders: [],
        message: "No wallets connected yet. Connect your wallet to appear on the leaderboard!",
      });
    }

    const walletBalances: WalletBalance[] = [];

    // Check if we're using Helius (much higher rate limits)
    const isHelius = SOLANA_RPC.includes("helius-rpc.com");
    
    // With Helius, we can process in parallel batches. Without it, process sequentially.
    const batchSize = isHelius ? 10 : 1;
    const delayBetweenBatches = isHelius ? 100 : 400; // Helius can handle faster requests

    for (let i = 0; i < featuredMerged.length; i += batchSize) {
      const batch = featuredMerged.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (user) => {
          if (!user.walletAddress) return;

          try {
            // Fetch SOL and USDT balances in parallel
            const [solBalance, usdtBalance] = await Promise.all([
              getSOLBalance(connection, user.walletAddress),
              getTokenBalance(connection, user.walletAddress, USDT_MINT),
            ]);

            // Fetch memecoin balances (only check if SOL or USDT > 0 to save requests)
            const memecoins: any[] = [];
            if (solBalance > 0 || usdtBalance > 0) {
              const memecoinPromises = Object.entries(MEMECOIN_MINTS).map(([symbol, mint]) =>
                getTokenBalance(connection, user.walletAddress!, mint).then(balance => ({
                  symbol,
                  balance,
                }))
              );
              
              const memecoinResults = await Promise.all(memecoinPromises);
              memecoinResults.forEach(result => {
                if (result.balance > 0) {
                  memecoins.push({
                    symbol: result.symbol,
                    balance: result.balance,
                    value: 0,
                  });
                }
              });
            }

            // Estimate total value (SOL price ≈ $150, rough estimate)
            const estimatedSOLValue = solBalance * 150;
            const estimatedUSDTValue = usdtBalance;
            const totalValue = estimatedSOLValue + estimatedUSDTValue;

            // Include ALL wallets (even with 0 balance) so users can see they're tracked
            walletBalances.push({
              walletAddress: user.walletAddress,
              userId: user.id,
              username: user.username,
              profileImage: user.profileImage || undefined,
              solBalance,
              usdtBalance,
              memecoins,
              totalValue,
            });
            
            console.log(`Processed wallet ${user.walletAddress}: ${solBalance} SOL, ${usdtBalance} USDT`);
          } catch (error: any) {
            console.error(`Error processing wallet ${user.walletAddress}:`, error.message || error);
            // Continue with next wallet - don't add to list if there's an error
          }
        })
      );

      // Small delay between batches (much shorter for Helius)
      if (i + batchSize < featuredMerged.length) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }

    // Sort by total value (descending)
    walletBalances.sort((a, b) => b.totalValue - a.totalValue);

    // Return top 50
    return NextResponse.json({
      traders: walletBalances.slice(0, 50),
    });
  } catch (error: any) {
    console.error("Top traders error:", error);
    return NextResponse.json(
      { error: "Failed to fetch top traders", detail: error.message },
      { status: 500 }
    );
  }
}

