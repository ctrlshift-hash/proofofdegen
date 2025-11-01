import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    let userId: string | null = session?.user?.id ?? null;
    if (!userId) {
      const wallet = request.headers.get("x-wallet-address") || request.headers.get("X-Wallet-Address");
      if (wallet) {
        const u = await prisma.user.findFirst({ where: { walletAddress: wallet } });
        if (u) userId = u.id;
      }
    }
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    await prisma.channel.update({ where: { id }, data: { members: { connect: { id: userId } } } });

    return NextResponse.json({ joined: true });
  } catch (e) {
    console.error("Join channel error:", e);
    return NextResponse.json({ error: "Failed to join channel" }, { status: 500 });
  }
}

