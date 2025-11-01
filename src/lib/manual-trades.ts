// Manual trade data for specific wallets
// You can add trades here that will show up alongside fetched trades

export interface ManualTrade {
  walletAddress: string;
  signature: string;
  timestamp: number; // Unix timestamp in seconds
  tokenIn: string; // Token address (e.g., "SOL" or token mint address)
  tokenInSymbol?: string; // Human-readable symbol (e.g., "SOL", "BONK")
  tokenOut: string; // Token address
  tokenOutSymbol?: string; // Human-readable symbol
  amountIn: number;
  amountOut: number;
  dex: string; // e.g., "Pump.fun", "Raydium", "Jupiter"
  type: "buy" | "sell";
  valueUsd?: number; // Optional USD value
  durationMinutes?: number; // Optional: trade duration in minutes
  tokenUnitsIn?: number; // Optional: token amount bought
  tokenUnitsOut?: number; // Optional: token amount sold
  tokenUrl?: string; // Optional: external URL for the token
}

// Add your manual trades here
export const MANUAL_TRADES: ManualTrade[] = [
  // Example format:
  // {
  //   walletAddress: "7bMexMe2cefk2d3eaVFBBShnT5CeqftKzyxfuKPzQduN",
  //   signature: "example_signature_123",
  //   timestamp: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
  //   tokenIn: "SOL",
  //   tokenInSymbol: "SOL",
  //   tokenOut: "J8JgFJsr16GQuBTwoq7TmjND8bLFw8fphEKtDFanpump",
  //   tokenOutSymbol: "PEPE",
  //   amountIn: 1.5, // SOL spent
  //   amountOut: 1000000, // Tokens received
  //   dex: "Pump.fun",
  //   type: "buy",
  //   valueUsd: 225, // Optional: $150 per SOL estimate
  // },
  // Cented (CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o) top trades past 30d
  {
    walletAddress: "CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o",
    signature: "manual_ice_buy",
    timestamp: Math.floor(Date.now() / 1000) - 170 * 60,
    tokenIn: "SOL",
    tokenInSymbol: "SOL",
    tokenOut: "CatvpTRLNCFJjqUvuLkoLHHjcPFeELuD3WorFFcJpump",
    tokenOutSymbol: "ICE",
    amountIn: 6.95,
    amountOut: 0,
    dex: "Pump.fun",
    type: "buy",
  },
  {
    walletAddress: "CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o",
    signature: "manual_ice_sell",
    timestamp: Math.floor(Date.now() / 1000) - 162 * 60,
    tokenIn: "CatvpTRLNCFJjqUvuLkoLHHjcPFeELuD3WorFFcJpump",
    tokenInSymbol: "ICE",
    tokenOut: "SOL",
    tokenOutSymbol: "SOL",
    amountIn: 0,
    amountOut: 103.68,
    dex: "Pump.fun",
    type: "sell",
  },
  {
    walletAddress: "CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o",
    signature: "manual_fraud_buy",
    timestamp: Math.floor(Date.now() / 1000) - 32.2 * 60,
    tokenIn: "SOL",
    tokenInSymbol: "SOL",
    tokenOut: "5DZ3RW9uyTBJACXTNXdgfSZdojVRkWbUzFYW6fkEpump",
    tokenOutSymbol: "FRAUDCOIN",
    amountIn: 6.08,
    amountOut: 0,
    dex: "Pump.fun",
    type: "buy",
  },
  {
    walletAddress: "CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o",
    signature: "manual_fraud_sell",
    timestamp: Math.floor(Date.now() / 1000) - 32.2 * 60,
    tokenIn: "5DZ3RW9uyTBJACXTNXdgfSZdojVRkWbUzFYW6fkEpump",
    tokenInSymbol: "FRAUDCOIN",
    tokenOut: "SOL",
    tokenOutSymbol: "SOL",
    amountIn: 0,
    amountOut: 74.29,
    dex: "Pump.fun",
    type: "sell",
  },
  {
    walletAddress: "CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o",
    signature: "manual_cn_buy",
    timestamp: Math.floor(Date.now() / 1000) - 89.9 * 60,
    tokenIn: "SOL",
    tokenInSymbol: "SOL",
    tokenOut: "8ueUTtwJmWFnvUuDXNkNr2wwoDQAwx7H8E32gtq8Afj6",
    tokenOutSymbol: "索拉娜",
    amountIn: 9.56,
    amountOut: 0,
    dex: "Pump.fun",
    type: "buy",
  },
  {
    walletAddress: "CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o",
    signature: "manual_cn_sell",
    timestamp: Math.floor(Date.now() / 1000) - 89.9 * 60,
    tokenIn: "8ueUTtwJmWFnvUuDXNkNr2wwoDQAwx7H8E32gtq8Afj6",
    tokenInSymbol: "索拉娜",
    tokenOut: "SOL",
    tokenOutSymbol: "SOL",
    amountIn: 0,
    amountOut: 56.48,
    dex: "Pump.fun",
    type: "sell",
  },
  {
    walletAddress: "CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o",
    signature: "manual_forever_buy",
    timestamp: Math.floor(Date.now() / 1000) - 37.5 * 60,
    tokenIn: "SOL",
    tokenInSymbol: "SOL",
    tokenOut: "5bnrEWuzqKRQRw9p8EecuiALqkCpNeJ98S9TknLspump",
    tokenOutSymbol: "FOREVER",
    amountIn: 4.49,
    amountOut: 0,
    dex: "Pump.fun",
    type: "buy",
  },
  {
    walletAddress: "CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o",
    signature: "manual_forever_sell",
    timestamp: Math.floor(Date.now() / 1000) - 37.5 * 60,
    tokenIn: "5bnrEWuzqKRQRw9p8EecuiALqkCpNeJ98S9TknLspump",
    tokenInSymbol: "FOREVER",
    tokenOut: "SOL",
    tokenOutSymbol: "SOL",
    amountIn: 0,
    amountOut: 46.58,
    dex: "Pump.fun",
    type: "sell",
  },
  {
    walletAddress: "CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o",
    signature: "manual_quantcat_buy",
    timestamp: Math.floor(Date.now() / 1000) - 97.7 * 60,
    tokenIn: "SOL",
    tokenInSymbol: "SOL",
    tokenOut: "7xGFkFTDyMqdVtzYhP7StaUN2ypaeZMxkgr6i6Wwpump",
    tokenOutSymbol: "QUANTCAT",
    amountIn: 9.56,
    amountOut: 0,
    dex: "Pump.fun",
    type: "buy",
  },
  {
    walletAddress: "CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o",
    signature: "manual_quantcat_sell",
    timestamp: Math.floor(Date.now() / 1000) - 97.7 * 60,
    tokenIn: "7xGFkFTDyMqdVtzYhP7StaUN2ypaeZMxkgr6i6Wwpump",
    tokenInSymbol: "QUANTCAT",
    tokenOut: "SOL",
    tokenOutSymbol: "SOL",
    amountIn: 0,
    amountOut: 49.56,
    dex: "Pump.fun",
    type: "sell",
  },
  {
    walletAddress: "CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o",
    signature: "manual_manlet_buy",
    timestamp: Math.floor(Date.now() / 1000) - 75.8 * 60,
    tokenIn: "SOL",
    tokenInSymbol: "SOL",
    tokenOut: "DRrvpz2gEzortn1vkhurdp1uzntseuEkroeHN2aMpump",
    tokenOutSymbol: "MANLET",
    amountIn: 17.53,
    amountOut: 0,
    dex: "Pump.fun",
    type: "buy",
  },
  {
    walletAddress: "CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o",
    signature: "manual_manlet_sell",
    timestamp: Math.floor(Date.now() / 1000) - 75.8 * 60,
    tokenIn: "DRrvpz2gEzortn1vkhurdp1uzntseuEkroeHN2aMpump",
    tokenInSymbol: "MANLET",
    tokenOut: "SOL",
    tokenOutSymbol: "SOL",
    amountIn: 0,
    amountOut: 56.77,
    dex: "Pump.fun",
    type: "sell",
  },
];

// Helper function to get manual trades for a wallet
export function getManualTradesForWallet(walletAddress: string): ManualTrade[] {
  return MANUAL_TRADES.filter(trade => 
    trade.walletAddress.toLowerCase() === walletAddress.toLowerCase()
  );
}


