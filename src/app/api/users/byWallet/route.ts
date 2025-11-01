import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = (searchParams.get("address") || "").trim();
    if (!address) return NextResponse.json({ error: "address is required" }, { status: 400 });

    let user = await prisma.user.findFirst({ where: { walletAddress: address } });
    if (!user) {
      const anonName = `anon_${address.slice(0, 6)}`;
      user = await prisma.user.create({ 
        data: { 
          username: anonName, 
          walletAddress: address, 
          isVerified: true,
          email: null,
          password: null,
        } 
      });
    } else if (!user.walletAddress) {
      // Update existing user if they don't have wallet address set
      user = await prisma.user.update({
        where: { id: user.id },
        data: { walletAddress: address },
      });
    }

    return NextResponse.json({ user: { id: user.id, username: user.username, walletAddress: user.walletAddress } });
  } catch (e) {
    console.error("byWallet error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}


