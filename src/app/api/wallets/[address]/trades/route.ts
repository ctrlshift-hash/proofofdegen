import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import { getManualTradesForWallet } from "@/lib/manual-trades";

// In-memory cache for trade data (10 minute TTL)
interface CachedTrades {
  data: any;
  timestamp: number;
}

const tradesCache = new Map<string, CachedTrades>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes in milliseconds

// Common DEX programs on Solana
const DEX_PROGRAMS = [
  "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8", // Raydium AMM V4
  "CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK", // Raydium CLMM
  "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4", // Jupiter V6
  "JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB", // Jupiter V4
  "9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP", // Orca
  "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc", // Orca Whirlpool
  "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P", // Pump.fun (memecoin launchpad)
  "7WduLbRfYhTJktjLfxsJn53gDFZXk3zrH8F7dv4u5iYT", // Phoenix (orderbook DEX)
  "BJ3jrUzddfuSrZHXSCxMUUQsjEyT44ayEZfrwsVQUFM", // Meteora DLMM
  "LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo", // Lifinity
];

// ALWAYS use mainnet - no devnet
const SOLANA_RPC = process.env.HELIUS_RPC_URL || 
  process.env.NEXT_PUBLIC_HELIUS_RPC_URL ||
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
  "https://api.mainnet-beta.solana.com";

// Log which RPC we're using for debugging
console.log(`[Trades Parser] Using RPC: ${SOLANA_RPC.includes('helius') ? 'HELIUS MAINNET ✅' : SOLANA_RPC.includes('devnet') ? 'DEVNET ❌' : 'PUBLIC MAINNET ✅'}`);

interface ParsedTrade {
  signature: string;
  timestamp: number;
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  amountOut: number;
  dex: string;
  type: "buy" | "sell";
  valueUsd?: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    console.log(`[Trades Parser] Starting for address...`);
    const resolvedParams = await params;
    const address = resolvedParams.address;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const forceRefresh = searchParams.get("refresh") === "true";

    console.log(`[Trades Parser] Wallet: ${address}, Limit: ${limit}, ForceRefresh: ${forceRefresh}`);

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = tradesCache.get(address);
      if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
        console.log(`[Trades Parser] Returning cached data (age: ${Math.floor((Date.now() - cached.timestamp) / 1000)}s)`);
        return NextResponse.json({
          ...cached.data,
          cached: true,
          cacheAge: Math.floor((Date.now() - cached.timestamp) / 1000),
        });
      } else if (cached) {
        console.log(`[Trades Parser] Cache expired (age: ${Math.floor((Date.now() - cached.timestamp) / 1000)}s), fetching fresh data...`);
      }
    } else {
      console.log(`[Trades Parser] Force refresh requested, ignoring cache...`);
    }

    if (!address || address === "[address]") {
      return NextResponse.json({ error: "Wallet address required" }, { status: 400 });
    }

    // Validate wallet address format
    try {
      new PublicKey(address);
    } catch (pubkeyError) {
      console.error(`[Trades Parser] Invalid wallet address: ${address}`);
      return NextResponse.json(
        { error: "Invalid wallet address format", detail: pubkeyError instanceof Error ? pubkeyError.message : String(pubkeyError) },
        { status: 400 }
      );
    }

    console.log(`[Trades Parser] Connecting to RPC: ${SOLANA_RPC.substring(0, 50)}...`);
    const connection = new Connection(SOLANA_RPC, "confirmed");
    const walletPubkey = new PublicKey(address);
    
    console.log(`[Trades Parser] Fetching signatures... (APIs disabled - manual trades will be included)`);

    // Helper function to retry with exponential backoff
    const retryWithBackoff = async <T>(
      fn: () => Promise<T>,
      maxRetries: number = 3,
      baseDelay: number = 1000
    ): Promise<T> => {
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          return await fn();
        } catch (error: any) {
          const isRateLimit = error?.message?.includes("429") || error?.message?.includes("Too many requests");
          
          if (isRateLimit && attempt < maxRetries - 1) {
            const delay = baseDelay * Math.pow(2, attempt);
            console.log(`[Trades Parser] Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          throw error;
        }
      }
      throw new Error("Max retries exceeded");
    };

    // Fetch recent transaction signatures with retry
    // Reduce to 50 to avoid rate limits (we can still catch trades)
    const signatures = await retryWithBackoff(
      () => connection.getSignaturesForAddress(walletPubkey, { limit: 50 }),
      3,
      2000
    );

    console.log(`[Local Parser] Found ${signatures.length} transaction signatures`);

    if (signatures.length === 0) {
      return NextResponse.json({ trades: [], message: "No transactions found" });
    }

    // Fetch transaction details (more to catch pump.fun and other trades)
    // Process in smaller batches with longer delays to avoid rate limits
    const transactions: any[] = [];
    const batchSize = 10; // Reduced from 20
    const delayBetweenBatches = 500; // Increased from 200
    
    for (let i = 0; i < Math.min(signatures.length, 50); i += batchSize) {
      const batch = signatures.slice(i, i + batchSize);
      
      try {
        const batchTxs = await retryWithBackoff(
          () => connection.getParsedTransactions(
            batch.map(s => s.signature),
            { maxSupportedTransactionVersion: 0 }
          ),
          3,
          2000
        );
        transactions.push(...batchTxs.filter(tx => tx !== null));
      } catch (batchError) {
        console.error(`[Trades Parser] Failed to fetch batch ${i}-${i + batchSize}:`, batchError);
        // Continue with other batches even if one fails
      }
      
      // Longer delay between batches
      if (i + batchSize < Math.min(signatures.length, 50)) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }
    
    console.log(`[Local Parser] Parsed ${transactions.length} transactions`);

    const trades: ParsedTrade[] = [];

    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i];
      const sig = signatures[i].signature;

      if (!tx || !tx.meta || tx.meta.err) continue;

      // Check if transaction involves known DEX programs
      // Also check instructions for program IDs (some DEXes use them differently)
      const accountKeys = tx.transaction.message.accountKeys.map((key: any) => key.pubkey.toBase58());
      const instructionProgramIds: string[] = [];
      
      // Extract program IDs from instructions
      if (tx.transaction.message.instructions) {
        for (const ix of tx.transaction.message.instructions) {
          if ('programId' in ix && ix.programId) {
            instructionProgramIds.push(ix.programId.toString());
          } else if (typeof ix === 'object' && 'programId' in ix) {
            const programId = (ix as any).programId;
            if (programId) {
              instructionProgramIds.push(typeof programId === 'string' ? programId : programId.toString());
            }
          }
        }
      }
      
      // Check all account keys and instruction program IDs
      const allProgramIds = [...accountKeys, ...instructionProgramIds];
      const dexProgram = allProgramIds.find(id => DEX_PROGRAMS.includes(id));
      
      // For pump.fun and other platforms, we'll detect trades by SOL/token balance changes
      // Even if we don't find the DEX program ID, check for swaps
      let isPotentialTrade = false;
      if (dexProgram) {
        isPotentialTrade = true;
      } else {
        // Check if this looks like a trade (SOL + token balance changes)
        const hasSOLTransfer = tx.meta?.preBalances && tx.meta?.postBalances;
        const hasTokenTransfers = (tx.meta?.preTokenBalances?.length || 0) > 0 || 
                                  (tx.meta?.postTokenBalances?.length || 0) > 0;
        isPotentialTrade = hasSOLTransfer && hasTokenTransfers;
      }
      
      if (!isPotentialTrade) continue;

      // Try to parse swap from pre/post token balances
      const preBalances = tx.meta.preTokenBalances || [];
      const postBalances = tx.meta.postTokenBalances || [];
      
      // Also check SOL balance changes (critical for pump.fun)
      const preSOLBalances = tx.meta.preBalances || [];
      const postSOLBalances = tx.meta.postBalances || [];
      
      // Find wallet's account index to check SOL balance
      let walletAccountIndex = -1;
      for (let idx = 0; idx < tx.transaction.message.accountKeys.length; idx++) {
        if (tx.transaction.message.accountKeys[idx].pubkey.toBase58() === address) {
          walletAccountIndex = idx;
          break;
        }
      }
      
      let solBalanceChange = 0;
      if (walletAccountIndex >= 0 && walletAccountIndex < preSOLBalances.length && 
          walletAccountIndex < postSOLBalances.length) {
        const preSOL = preSOLBalances[walletAccountIndex] / 1e9; // Convert lamports to SOL
        const postSOL = postSOLBalances[walletAccountIndex] / 1e9;
        solBalanceChange = postSOL - preSOL;
      }

      // Find tokens that changed (swap)
      const balanceChanges = new Map<string, number>();
      
      // Track token balance changes
      for (const pre of preBalances) {
        const post = postBalances.find(
          (p: any) => p.accountIndex === pre.accountIndex && 
               p.mint === pre.mint &&
               p.owner === pre.owner
        );
        
        if (post) {
          const preAmount = parseFloat(pre.uiTokenAmount.uiAmountString || "0");
          const postAmount = parseFloat(post.uiTokenAmount.uiAmountString || "0");
          const change = postAmount - preAmount;
          
          if (Math.abs(change) > 0.0001) {
            balanceChanges.set(pre.mint, change);
          }
        }
      }
      
      // Also check for new token accounts (pump.fun might create new accounts)
      for (const post of postBalances) {
        const pre = preBalances.find(
          p => p.accountIndex === post.accountIndex && 
               p.mint === post.mint &&
               p.owner === post.owner
        );
        
        if (!pre) {
          // New token account - this is a buy
          const amount = parseFloat(post.uiTokenAmount.uiAmountString || "0");
          if (amount > 0.0001) {
            balanceChanges.set(post.mint, amount);
          }
        }
      }
      
      // Add SOL to balance changes if there's a significant change
      const SOL_MINT = "So11111111111111111111111111111111111111112";
      if (Math.abs(solBalanceChange) > 0.001) {
        balanceChanges.set(SOL_MINT, solBalanceChange);
      }

      // Need at least 2 assets (SOL + token OR token + token)
      if (balanceChanges.size < 2) continue;

      // Identify token in and out
      const changes = Array.from(balanceChanges.entries());
      const tokenIn = changes.find(([_, change]) => change < 0)?.[0];
      const tokenOut = changes.find(([_, change]) => change > 0)?.[0];

      if (!tokenIn || !tokenOut) continue;

      const amountIn = Math.abs(changes.find(([mint]) => mint === tokenIn)?.[1] || 0);
      const amountOut = Math.abs(changes.find(([mint]) => mint === tokenOut)?.[1] || 0);

      // Determine if it's a SOL trade
      const isSOLIn = tokenIn === SOL_MINT;
      const isSOLOut = tokenOut === SOL_MINT;

      // Only show trades involving SOL (pump.fun trades are SOL <-> Token)
      if (!isSOLIn && !isSOLOut) continue;

      // Determine DEX name
      let dexName = "Unknown DEX";
      if (dexProgram) {
        if (dexProgram === "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8" || 
            dexProgram === "CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK") {
          dexName = "Raydium";
        } else if (dexProgram.startsWith("JUP")) {
          dexName = "Jupiter";
        } else if (dexProgram === "9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP" ||
                   dexProgram === "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc") {
          dexName = "Orca";
        } else if (dexProgram === "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P") {
          dexName = "Pump.fun"; // Popular memecoin launchpad
        } else if (dexProgram === "7WduLbRfYhTJktjLfxsJn53gDFZXk3zrH8F7dv4u5iYT") {
          dexName = "Phoenix";
        } else if (dexProgram === "BJ3jrUzddfuSrZHXSCxMUUQsjEyT44ayEZfrwsVQUFM") {
          dexName = "Meteora";
        } else if (dexProgram === "LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo") {
          dexName = "Lifinity";
        }
      } else {
        // No DEX program found, but we detected a trade - might be pump.fun or another platform
        // Check if token mint address matches pump.fun pattern or if transaction structure suggests pump.fun
        if (tokenOut !== SOL_MINT && tokenOut.length === 44) {
          // Token addresses from pump.fun are typically long base58 strings
          // If we see SOL -> Token swap without a known DEX, it's likely pump.fun or similar
          dexName = "Pump.fun (detected)";
        } else if (tokenIn !== SOL_MINT && tokenIn.length === 44) {
          // Token -> SOL without known DEX might be pump.fun sell
          dexName = "Pump.fun (detected)";
        }
      }

      trades.push({
        signature: sig,
        timestamp: signatures[i].blockTime || Date.now() / 1000,
        tokenIn: isSOLIn ? "SOL" : tokenIn.slice(0, 8),
        tokenOut: isSOLOut ? "SOL" : tokenOut.slice(0, 8),
        amountIn,
        amountOut,
        dex: dexName,
        type: isSOLIn ? "buy" : "sell",
      });
    }

    // Calculate trade value (in SOL terms for sorting)
    trades.forEach(trade => {
      // Estimate trade value: if SOL involved, use SOL amount; otherwise estimate
      if (trade.tokenIn === "SOL" || trade.tokenOut === "SOL") {
        const solAmount = trade.tokenIn === "SOL" ? trade.amountIn : trade.amountOut;
        trade.valueUsd = solAmount * 150; // Rough SOL price estimate
      } else {
        // Estimate based on token amounts (rough)
        trade.valueUsd = Math.max(trade.amountIn, trade.amountOut) * 0.01; // Placeholder
      }
    });

    // Calculate PnL by matching buys and sells
    const holdings = new Map<string, Array<{ solAmount: number; tokenAmount: number; timestamp: number }>>();
    let totalPnL = 0;
    let realizedPnL = 0;
    let totalTrades = trades.length;
    let winningTrades = 0;
    let losingTrades = 0;

    // Process trades chronologically to match buys with sells
    const sortedTrades = [...trades].sort((a, b) => a.timestamp - b.timestamp);
    
    for (const trade of sortedTrades) {
      if (trade.type === "buy" && trade.tokenOut !== "SOL") {
        // Record buy: we now hold tokens
        const tokenMint = trade.tokenOut === "SOL" ? "SOL" : trade.tokenOut;
        const solSpent = trade.amountIn; // SOL spent
        const tokensReceived = trade.amountOut; // Tokens received
        
        if (!holdings.has(tokenMint)) {
          holdings.set(tokenMint, []);
        }
        holdings.get(tokenMint)!.push({
          solAmount: solSpent,
          tokenAmount: tokensReceived,
          timestamp: trade.timestamp,
        });
      } else if (trade.type === "sell" && trade.tokenIn !== "SOL") {
        // Record sell: calculate profit/loss
        const tokenMint = trade.tokenIn === "SOL" ? "SOL" : trade.tokenIn;
        const solReceived = trade.amountOut; // SOL received
        const tokensSold = trade.amountIn; // Tokens sold
        
        if (holdings.has(tokenMint) && holdings.get(tokenMint)!.length > 0) {
          // Use FIFO (First In First Out) to calculate PnL
          let remainingToSell = tokensSold;
          const position = holdings.get(tokenMint)!;
          
          while (remainingToSell > 0 && position.length > 0) {
            const buyPosition = position[0];
            const sellRatio = Math.min(remainingToSell / buyPosition.tokenAmount, 1);
            const tokensSoldFromPosition = buyPosition.tokenAmount * sellRatio;
            const solCostBasis = buyPosition.solAmount * sellRatio;
            const solReceivedFromPosition = solReceived * (tokensSoldFromPosition / tokensSold);
            
            const pnl = solReceivedFromPosition - solCostBasis;
            realizedPnL += pnl;
            
            if (pnl > 0) winningTrades++;
            else if (pnl < 0) losingTrades++;
            
            remainingToSell -= tokensSoldFromPosition;
            
            if (sellRatio >= 1) {
              position.shift(); // Fully sold this position
            } else {
              // Partially sold
              buyPosition.tokenAmount -= tokensSoldFromPosition;
              buyPosition.solAmount -= solCostBasis;
            }
          }
        }
      }
    }

    // Estimate unrealized PnL (current holdings vs buy price)
    // For now, we'll just use realized PnL as total
    totalPnL = realizedPnL;

    // Merge with manual trades (from manual-trades.ts file)
    const manualTrades = getManualTradesForWallet(address);
    console.log(`[Trades Parser] Found ${manualTrades.length} manual trades for ${address}`);
    
    // Convert manual trades to ParsedTrade format and merge
    const manualTradesParsed: ParsedTrade[] = manualTrades.map(mt => ({
      signature: mt.signature,
      timestamp: mt.timestamp,
      tokenIn: mt.tokenIn,
      tokenOut: mt.tokenOut,
      amountIn: mt.amountIn,
      amountOut: mt.amountOut,
      dex: mt.dex,
      type: mt.type,
      valueUsd: mt.valueUsd,
    }));
    
    // Combine fetched trades with manual trades
    const allTrades = [...trades, ...manualTradesParsed];
    
    // Sort by timestamp (most recent first) for recent trades
    const recentTrades = [...allTrades].sort((a, b) => b.timestamp - a.timestamp);
    
    // Sort by trade value (largest first) for top trades
    const topTrades = [...allTrades].sort((a, b) => (b.valueUsd || 0) - (a.valueUsd || 0));

    return NextResponse.json({
      trades: recentTrades.slice(0, limit),
      topTrades: topTrades.slice(0, limit),
      total: trades.length,
      pnl: {
        total: totalPnL,
        realized: realizedPnL,
        totalTrades,
        winningTrades,
        losingTrades,
        winRate: totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0,
      },
    });
  } catch (error: any) {
    console.error("[Trades Parser] Fatal error:", error);
    console.error("[Trades Parser] Error message:", error?.message);
    console.error("[Trades Parser] Error stack:", error?.stack);
    return NextResponse.json(
      { 
        error: "Failed to fetch trades", 
        detail: error?.message || "Unknown error",
        stack: process.env.NODE_ENV === "development" ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}

