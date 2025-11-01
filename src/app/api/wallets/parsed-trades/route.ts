import { NextRequest, NextResponse } from "next/server";

// Manual-only mode: external trade importer disabled
export async function GET(req: NextRequest) {
  return NextResponse.json({ trades: [], source: "manual-only" });
}


