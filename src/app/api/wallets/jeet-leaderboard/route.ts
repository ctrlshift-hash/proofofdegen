import { NextRequest, NextResponse } from "next/server";
import { getJeetProfiles } from "@/lib/jeet-trades";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get("timeframe") || "daily"; // daily|weekly|monthly
    const sort = searchParams.get("sort") || "usd"; // usd|sol

    const profiles = getJeetProfiles();
    // Placeholder: timeframe isn't changing data yet; hooks in for future parser

    let ranked = profiles
      .slice()
      .sort((a, b) => {
        if (sort === "sol") return (a.pnlSol ?? 0) - (b.pnlSol ?? 0);
        return (a.pnlUsd ?? 0) - (b.pnlUsd ?? 0);
      }) // most negative first
      .map((p, idx) => ({ rank: idx + 1, ...p }));
    return NextResponse.json({ profiles: ranked, timeframe, sort });
  } catch (e) {
    return NextResponse.json({ error: "Failed to load jeet leaderboard" }, { status: 500 });
  }
}


