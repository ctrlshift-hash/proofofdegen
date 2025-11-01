export type JeetTrade = {
  wallet: string;
  tokenMint: string;
  tokenSymbol?: string;
  side: "buy" | "sell";
  qty: number; // token quantity
  priceUsd: number; // execution price in USD
  valueUsd: number; // qty * priceUsd
  timestamp: string; // ISO
  note?: string;
  txUrl?: string;
  tokenUrl?: string;
};

export type JeetEntry = {
  wallet: string;
  worstTrades: JeetTrade[];
};

export type JeetProfile = {
  wallet: string;
  name: string;
  pfpUrl: string;
  description?: string;
  jeetScore?: number;
  badges?: string[];
  roastTopQuote?: string;
  mostJeeted?: string[]; // token symbols/names (1-3)
  pnlSol: number; // total realized/unrealized loss in SOL (negative = loss)
  pnlUsd: number; // same in USD (negative = loss)
  worstTrades: JeetTrade[];
};

// Seed with examples; you can send me real wallets/trades to add here.
export const JEET_PROFILES: JeetProfile[] = [
  // Placeholder entries for requested names. Wallets and trades can be filled later.
  { wallet: "Jtlynk111111111111111111111111111111111111111", name: "Lynk", pfpUrl: "/vercel.svg", description: "Buys tops so often he’s on first-name basis with resistance.", jeetScore: 0, badges: [], roastTopQuote: "", mostJeeted: [], pnlSol: 0, pnlUsd: 0, worstTrades: [] },
  { wallet: "Jtfrankdegods11111111111111111111111111111111", name: "Frankdegods", pfpUrl: "/vercel.svg", description: "Turned \"community call\" into \"community exit liquidity\" in 12 minutes.", jeetScore: 0, badges: [], roastTopQuote: "", mostJeeted: [], pnlSol: 0, pnlUsd: 0, worstTrades: [] },
  { wallet: "Jtbastille1111111111111111111111111111111111", name: "Bastille", pfpUrl: "/vercel.svg", description: "Stormed the charts, forgot the stop-loss.", jeetScore: 0, badges: [], roastTopQuote: "", mostJeeted: [], pnlSol: 0, pnlUsd: 0, worstTrades: [] },
  { wallet: "As7HjL7dzzvbRbaD3WCun47robib2kmAKRXMvjHkSMB5", name: "Otta", pfpUrl: "/vercel.svg", description: "Always early… to the dump party.", jeetScore: 0, badges: [], roastTopQuote: "", mostJeeted: ["Fapcoin"], pnlSol: 0, pnlUsd: 0, worstTrades: [
    {
      wallet: "As7HjL7dzzvbRbaD3WCun47robib2kmAKRXMvjHkSMB5",
      tokenMint: "27dAPsyL9vxaLonk4uqnLKE1F9zUSvvHsoYj436opump",
      tokenSymbol: "Fapcoin",
      side: "sell",
      qty: 0,
      priceUsd: 0,
      valueUsd: 0,
      timestamp: new Date().toISOString(),
      note: "Most jeeted coin",
      tokenUrl: "https://trade.padre.gg/trade/solana/27dAPsyL9vxaLonk4uqnLKE1F9zUSvvHsoYj436opump"
    }
  ] },
  { wallet: "Jtxunle1111111111111111111111111111111111111", name: "Xunle", pfpUrl: "/vercel.svg", description: "Catches every wick. Unfortunately, the down ones.", jeetScore: 0, badges: [], roastTopQuote: "", mostJeeted: [], pnlSol: 0, pnlUsd: 0, worstTrades: [] },
  { wallet: "Jtdior11111111111111111111111111111111111111", name: "Dior", pfpUrl: "/vercel.svg", description: "Luxury entries, thrift-store exits.", jeetScore: 0, badges: [], roastTopQuote: "", mostJeeted: [], pnlSol: 0, pnlUsd: 0, worstTrades: [] },
  { wallet: "Jtcasino111111111111111111111111111111111111", name: "Casino", pfpUrl: "/vercel.svg", description: "All-in on red; chart printed green. Again.", jeetScore: 0, badges: [], roastTopQuote: "", mostJeeted: [], pnlSol: 0, pnlUsd: 0, worstTrades: [] },
  { wallet: "Jtansem1111111111111111111111111111111111111", name: "Ansem", pfpUrl: "/vercel.svg", description: "Alpha so strong he fades himself.", jeetScore: 0, badges: [], roastTopQuote: "", mostJeeted: [], pnlSol: 0, pnlUsd: 0, worstTrades: [] },
  { wallet: "Jtbeaver111111111111111111111111111111111111", name: "Beaver", pfpUrl: "/vercel.svg", description: "Builds dams. Can’t dam the sell button.", jeetScore: 0, badges: [], roastTopQuote: "", mostJeeted: [], pnlSol: 0, pnlUsd: 0, worstTrades: [] },
  { wallet: "Jtjameswynn111111111111111111111111111111111", name: "James Wynn", pfpUrl: "/vercel.svg", description: "Last name lies.", jeetScore: 0, badges: [], roastTopQuote: "", mostJeeted: [], pnlSol: 0, pnlUsd: 0, worstTrades: [] },
  { wallet: "Jtinfinitygainz11111111111111111111111111111", name: "Infinity Gainz", pfpUrl: "/vercel.svg", description: "Infinite conviction, finite balance.", jeetScore: 0, badges: [], roastTopQuote: "", mostJeeted: [], pnlSol: 0, pnlUsd: 0, worstTrades: [] },
  { wallet: "Jtprofessorcrypto1111111111111111111111111111", name: "Professor Crypto", pfpUrl: "/vercel.svg", description: "Tenure in TA, minor in coping.", jeetScore: 0, badges: [], roastTopQuote: "", mostJeeted: [], pnlSol: 0, pnlUsd: 0, worstTrades: [] },
  { wallet: "Jtthreadguy111111111111111111111111111111111", name: "ThreadGuy", pfpUrl: "/vercel.svg", description: "Writes 20 tweets, buys 20% higher.", jeetScore: 0, badges: [], roastTopQuote: "", mostJeeted: [], pnlSol: 0, pnlUsd: 0, worstTrades: [] },
  { wallet: "Jtbolivian1111111111111111111111111111111111", name: "Bolivian", pfpUrl: "/vercel.svg", description: "HODLer until the first 2% candle.", jeetScore: 0, badges: [], roastTopQuote: "", mostJeeted: [], pnlSol: 0, pnlUsd: 0, worstTrades: [] },
  { wallet: "Jtprada1111111111111111111111111111111111111", name: "Prada", pfpUrl: "/vercel.svg", description: "Designer bags, rugged straps.", jeetScore: 0, badges: [], roastTopQuote: "", mostJeeted: [], pnlSol: 0, pnlUsd: 0, worstTrades: [] },
];

export function getAllJeetTrades(): JeetTrade[] {
  return JEET_PROFILES.flatMap((e) => e.worstTrades);
}

export function getJeetProfiles(): JeetProfile[] {
  return JEET_PROFILES;
}


