import { NextRequest, NextResponse } from "next/server";

type CacheEntry = { balanceLamports: number; ts: number };
const CACHE: Record<string, CacheEntry> = {};
const TTL_MS = 15 * 60 * 1000; // 15 minutes

async function fetchBalanceLamports(address: string): Promise<number> {
  const res = await fetch("https://api.mainnet-beta.solana.com", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getBalance",
      params: [address],
    }),
  });
  if (!res.ok) throw new Error(`RPC ${res.status}`);
  const json = await res.json();
  if (json?.result?.value === undefined) throw new Error("Bad RPC response");
  return json.result.value as number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");
    if (!address) return NextResponse.json({ error: "address required" }, { status: 400 });

    const now = Date.now();
    const cached = CACHE[address];
    if (cached && now - cached.ts < TTL_MS) {
      return NextResponse.json({ address, lamports: cached.balanceLamports, sol: cached.balanceLamports / 1e9, cached: true });
    }

    const lamports = await fetchBalanceLamports(address);
    CACHE[address] = { balanceLamports: lamports, ts: now };
    return NextResponse.json({ address, lamports, sol: lamports / 1e9, cached: false });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to fetch balance" }, { status: 500 });
  }
}


