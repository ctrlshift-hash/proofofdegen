import { NextRequest, NextResponse } from "next/server";

// Birdeye API for comprehensive Solana trading data
// Docs: https://docs.birdeye.so/
// Base URL: https://public-api.birdeye.so
const BIRDEYE_API_KEY = process.env.BIRDEYE_API_KEY || "";
const BIRDEYE_BASE_URL = "https://public-api.birdeye.so";

interface TradeData {
  signature: string;
  timestamp: number;
  tokenIn: string;
  tokenInSymbol?: string;
  tokenInName?: string;
  tokenOut: string;
  tokenOutSymbol?: string;
  tokenOutName?: string;
  amountIn: number;
  amountOut: number;
  amountInUsd?: number;
  amountOutUsd?: number;
  dex: string;
  type: "buy" | "sell";
  price?: number;
  pnl?: number;
  pnlPercent?: number;
}

/**
 * Fetch wallet transaction history from Birdeye
 * Endpoint: /v1/wallet/txn_list
 * Docs: https://docs.birdeye.so/
 */
async function fetchBirdeyeWalletTransactions(
  walletAddress: string,
  limit: number = 50
): Promise<TradeData[]> {
  if (!BIRDEYE_API_KEY) {
    console.warn("Birdeye API key not set. Using fallback method.");
    return [];
  }

  try {
    // Try multiple Birdeye endpoints - they might have different names
    // Endpoint 1: Wallet Transaction History (Beta)
    let response = await fetch(
      `${BIRDEYE_BASE_URL}/v1/wallet/txn_list?wallet=${walletAddress}&type=all&limit=${limit}`,
      {
        headers: {
          "X-API-KEY": BIRDEYE_API_KEY,
        },
      }
    );
    
    console.log(`[Birdeye] Endpoint /v1/wallet/txn_list - Status: ${response.status}`);

    let data: any = null;
    
    if (response.ok) {
      data = await response.json();
      console.log("[Birdeye] Successfully fetched from txn_list endpoint");
    } else {
      // Try endpoint 2: Defi wallet trades
      console.log("[Birdeye] Trying /defi/wallet_trades endpoint...");
      response = await fetch(
        `${BIRDEYE_BASE_URL}/defi/wallet_trades?wallet=${walletAddress}&limit=${limit}`,
        {
          headers: {
            "X-API-KEY": BIRDEYE_API_KEY,
          },
        }
      );
      
      if (response.ok) {
        data = await response.json();
        console.log("[Birdeye] Successfully fetched from wallet_trades endpoint");
      } else {
        const errorText = await response.text();
        console.error("[Birdeye] All endpoints failed. Last error:", response.status, errorText.substring(0, 200));
        console.log("[Birdeye] Returning empty - fallback parser will be used");
        return [];
      }
    }

    const trades: TradeData[] = [];

    // Debug: Log the FULL response structure to understand Birdeye's format
    console.log("=== BIRDEYE API DEBUG ===");
    console.log("Response status:", response.status);
    console.log("Response keys:", Object.keys(data || {}));
    console.log("Success:", data?.success);
    console.log("Has data:", !!data?.data);
    if (data?.data) {
      console.log("Data keys:", Object.keys(data.data));
      console.log("Items count:", data.data.items?.length || data.data.transactions?.length || 0);
      if (data.data.items?.[0]) {
        console.log("Sample item keys:", Object.keys(data.data.items[0]));
        console.log("Sample item:", JSON.stringify(data.data.items[0]).substring(0, 800));
      }
    }
    console.log("=========================");

    // Parse Birdeye transaction format - handle multiple response structures
    let items: any[] = [];
    
    if (data.success && data.data) {
      items = data.data.items || data.data.transactions || data.data.trades || data.data || [];
    } else if (Array.isArray(data.data)) {
      items = data.data;
    } else if (Array.isArray(data)) {
      items = data;
    }

    console.log(`Found ${items.length} items to process`);

    // Process ALL transactions - be very permissive to catch all trades including pump.fun
    for (const tx of items) {
      // Very permissive: include ANY transaction that might be a trade
      // This will catch pump.fun, all DEX swaps, token transfers that are trades, etc.
      const hasTokenIn = tx.fromToken || tx.tokenIn || tx.input || tx.tokenInAddress || tx.sourceToken;
      const hasTokenOut = tx.toToken || tx.tokenOut || tx.output || tx.tokenOutAddress || tx.targetToken;
      const hasSwap = tx.transactionType === "swap" || tx.type === "swap" || tx.swap || tx.swapTransaction || 
                      tx.transactionType === "trade" || tx.tradeType;
      const hasDex = tx.dex || tx.platform || tx.source || tx.dEX || tx.program || tx.dexName;
      const hasAmounts = (tx.fromAmount || tx.amountIn || tx.inputAmount || tx.tokenInAmount || tx.sourceAmount) ||
                        (tx.toAmount || tx.amountOut || tx.outputAmount || tx.tokenOutAmount || tx.targetAmount);
      
      // Include if ANY trade indicator is present - very permissive
      // This ensures we catch pump.fun trades even if they're structured differently
      if (hasSwap || hasDex || (hasTokenIn && hasTokenOut) || (hasAmounts && (hasTokenIn || hasTokenOut))) {
        const tokenIn = tx.fromToken?.address || tx.tokenIn?.address || tx.input?.address || tx.tokenInAddress || "";
        const tokenOut = tx.toToken?.address || tx.tokenOut?.address || tx.output?.address || tx.tokenOutAddress || "";
        
        // Skip if both tokens are empty
        if (!tokenIn && !tokenOut) continue;
        
        // If only one token, try to infer from SOL balance changes
        const amountIn = tx.fromAmount || tx.amountIn || tx.inputAmount || tx.tokenInAmount || 0;
        const amountOut = tx.toAmount || tx.amountOut || tx.outputAmount || tx.tokenOutAmount || 0;

        // Include ALL transactions that look like trades - NO amount filtering
        // Pump.fun trades might have small amounts or structured differently
        // Include if: swap detected, has DEX/platform, or has both tokens, or has amounts
        if (hasSwap || hasDex || (hasTokenIn && hasTokenOut) || amountIn > 0 || amountOut > 0) {
          trades.push({
            signature: tx.signature || tx.txHash || tx.hash || tx.transactionHash || "",
            timestamp: tx.blockUnixTime || tx.timestamp || tx.blockTime || tx.time || Math.floor(Date.now() / 1000),
            tokenIn: tokenIn || "SOL",
            tokenInSymbol: tx.fromToken?.symbol || tx.tokenIn?.symbol || tx.input?.symbol || "SOL",
            tokenInName: tx.fromToken?.name || tx.tokenIn?.name || tx.input?.name || "Solana",
            tokenOut: tokenOut || "SOL",
            tokenOutSymbol: tx.toToken?.symbol || tx.tokenOut?.symbol || tx.output?.symbol || "SOL",
            tokenOutName: tx.toToken?.name || tx.tokenOut?.name || tx.output?.name || "Solana",
            amountIn: amountIn,
            amountOut: amountOut,
            amountInUsd: tx.fromAmountUsd || tx.amountInUsd || tx.inputAmountUsd,
            amountOutUsd: tx.toAmountUsd || tx.amountOutUsd || tx.outputAmountUsd,
            dex: tx.dex || tx.platform || tx.source || tx.dEX || tx.program || tx.dexName || 
                 (tx.programId === "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P" ? "Pump.fun" : null) || "Unknown",
            type: tx.isBuy === true || 
                  (tokenOut && !tokenIn) || // Received tokens without sending = buy
                  (tokenIn && !tokenOut && amountOut > amountIn) // SOL -> Token = buy
              ? "buy" : "sell",
            price: tx.price || tx.swapPrice || tx.executionPrice,
            pnl: tx.pnl || tx.profitLoss,
            pnlPercent: tx.pnlPercent || tx.profitLossPercent,
          });
        }
      }
    }

    console.log(`Birdeye API: Found ${trades.length} trades for wallet ${walletAddress}`);
    return trades;
  } catch (error) {
    console.error("Error fetching Birdeye wallet transactions:", error);
    return [];
  }
}

/**
 * Fetch wallet PnL summary from Birdeye
 * Endpoint: /v1/wallet/pnl_summary
 * Docs: https://docs.birdeye.so/reference/get-wallet-pnl-summary
 */
async function fetchBirdeyeWalletPnL(walletAddress: string) {
  if (!BIRDEYE_API_KEY) {
    return null;
  }

  try {
    const response = await fetch(
      `${BIRDEYE_BASE_URL}/v1/wallet/pnl_summary?wallet=${walletAddress}`,
      {
        headers: {
          "X-API-KEY": BIRDEYE_API_KEY,
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data.success && data.data) {
      return {
        totalPnL: data.data.totalPnl || 0,
        totalPnLUsd: data.data.totalPnlUsd || 0,
        realizedPnL: data.data.realizedPnl || 0,
        unrealizedPnL: data.data.unrealizedPnl || 0,
        winRate: data.data.winRate || 0,
        totalTrades: data.data.totalTrades || 0,
        winningTrades: data.data.winningTrades || 0,
        losingTrades: data.data.losingTrades || 0,
      };
    }

    return null;
  } catch (error) {
    console.error("Error fetching Birdeye PnL:", error);
    return null;
  }
}

/**
 * Alternative: Fetch trades using token trades endpoint
 * This can show trades for specific tokens
 */
async function fetchBirdeyeTokenTrades(
  tokenAddress: string,
  limit: number = 50
): Promise<TradeData[]> {
  if (!BIRDEYE_API_KEY) {
    return [];
  }

  try {
    // GET /v1/token/trades
    const response = await fetch(
      `${BIRDEYE_BASE_URL}/v1/token/trades?address=${tokenAddress}&limit=${limit}`,
      {
        headers: {
          "X-API-KEY": BIRDEYE_API_KEY,
        },
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    // Parse token trades format...
    return [];
  } catch (error) {
    console.error("Error fetching Birdeye token trades:", error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("address");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address required" },
        { status: 400 }
      );
    }

    console.log(`[Comprehensive Trades] Starting fetch for wallet: ${walletAddress}`);
    console.log(`[Comprehensive Trades] ⚠️ APIs disabled - using manual trades only`);

    // APIs disabled - return empty, let frontend use local parser + manual trades
    const trades: TradeData[] = [];
    const source = "local-parser-needed";

    console.log(`[Comprehensive Trades] Wallet: ${walletAddress}, Source: ${source}, Found: ${trades.length} trades`);

    return NextResponse.json({
      trades,
      pnl: null,
      source,
      count: trades.length,
      apiKeySet: false,
    });
  } catch (error: any) {
    console.error("[Comprehensive Trades] Fatal error:", error);
    console.error("[Comprehensive Trades] Error stack:", error?.stack);
    return NextResponse.json(
      { 
        error: "Failed to fetch comprehensive trades", 
        detail: error?.message || "Unknown error",
        stack: process.env.NODE_ENV === "development" ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}
