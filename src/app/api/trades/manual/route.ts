import { NextRequest, NextResponse } from "next/server";
import { MANUAL_TRADES, ManualTrade } from "@/lib/manual-trades";

// GET: List all manual trades (for debugging/viewing)
export async function GET() {
  return NextResponse.json({
    trades: MANUAL_TRADES,
    count: MANUAL_TRADES.length,
  });
}

// POST: Add a manual trade (for adding via API if needed)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['walletAddress', 'signature', 'timestamp', 'tokenIn', 'tokenOut', 'amountIn', 'amountOut', 'dex', 'type'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // Note: This just validates. To actually add to MANUAL_TRADES array,
    // you'd need to edit the file directly or use a database.
    // For now, this is just a validation endpoint.
    
    return NextResponse.json({
      message: "Trade validated. To add it, edit src/lib/manual-trades.ts file.",
      trade: body as ManualTrade,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Invalid request", detail: error.message },
      { status: 400 }
    );
  }
}


