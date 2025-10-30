import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { walletAddress } = await request.json();
    if (!walletAddress) {
      return NextResponse.json({ error: "walletAddress is required" }, { status: 400 });
    }

    // Update user in DB
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { walletAddress },
    });

    return NextResponse.json({
      message: "Wallet address updated!",
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        username: user.username,
      },
    });
  } catch (error: any) {
    // Unique constraint failed: wallet already linked to another account
    if (error.code === "P2002" && error.meta?.target?.includes("walletAddress")) {
      return NextResponse.json({ error: "Wallet address already linked to another user" }, { status: 409 });
    }
    console.error("Update wallet error:", error);
    return NextResponse.json({ error: "Failed to update wallet address" }, { status: 500 });
  }
}
