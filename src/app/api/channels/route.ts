import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ?? null;

    const channels = await prisma.channel.findMany({
      include: {
        owner: { select: { id: true, username: true } },
        _count: { select: { members: true } },
        members: userId ? { select: { id: true }, where: { id: userId } } : false as any,
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = channels.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      memberCount: c._count.members,
      isTokenGated: !!c.tokenAddress,
      tokenAddress: c.tokenAddress,
      minBalance: c.minBalance,
      isOwner: userId ? c.ownerId === userId : false,
      isJoined: userId ? (c.members as any[])?.some(m => m.id === userId) : false,
      category: c.tokenAddress ? "Token-Gated" : "General",
      trending: false,
    }));

    return NextResponse.json({ channels: formatted });
  } catch (e) {
    console.error("List channels error:", e);
    return NextResponse.json({ error: "Failed to fetch channels" }, { status: 500 });
  }
}

