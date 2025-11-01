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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    let ownerId = session?.user?.id ?? null;

    if (!ownerId) {
      const wallet = request.headers.get("x-wallet-address") || request.headers.get("X-Wallet-Address");
      if (wallet) {
        const u = await prisma.user.findFirst({ where: { walletAddress: wallet } });
        if (u) ownerId = u.id;
      }
    }

    if (!ownerId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await request.json();
    const name = String(body?.name || "").trim();
    const description = body?.description ? String(body.description).trim() : null;
    const tokenAddress = body?.tokenAddress ? String(body.tokenAddress).trim() : null;
    const minBalance = body?.minBalance ?? null;

    if (!name || name.length < 3) return NextResponse.json({ error: "Name must be at least 3 characters" }, { status: 400 });

    const created = await prisma.channel.create({
      data: {
        name,
        description,
        tokenAddress,
        minBalance,
        ownerId,
        members: { connect: { id: ownerId } },
      },
      include: {
        _count: { select: { members: true } },
      },
    });

    const formatted = {
      id: created.id,
      name: created.name,
      description: created.description,
      memberCount: created._count.members,
      isTokenGated: !!created.tokenAddress,
      tokenAddress: created.tokenAddress,
      minBalance: created.minBalance,
      isOwner: true,
      isJoined: true,
      category: created.tokenAddress ? "Token-Gated" : "General",
      trending: false,
    };

    return NextResponse.json({ channel: formatted });
  } catch (e) {
    console.error("Create channel error:", e);
    return NextResponse.json({ error: "Failed to create channel" }, { status: 500 });
  }
}

