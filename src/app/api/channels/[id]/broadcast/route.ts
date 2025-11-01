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
    const { id: channelId } = await params;

    let userId = session?.user?.id ?? null;
    if (!userId) {
      const wallet = request.headers.get("x-wallet-address") || request.headers.get("X-Wallet-Address");
      if (wallet) {
        const u = await prisma.user.findFirst({ where: { walletAddress: wallet } });
        if (u) userId = u.id;
      }
    }
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    // only owner can broadcast
    const channel = await prisma.channel.findUnique({ where: { id: channelId }, select: { ownerId: true } });
    if (!channel || channel.ownerId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const content = String(body?.content || "").trim();
    if (!content) return NextResponse.json({ error: "Content required" }, { status: 400 });

    const post = await prisma.channelPost.create({ data: { content, channelId, userId } });

    const members = await prisma.user.findMany({ where: { channels: { some: { id: channelId } } }, select: { id: true } });
    const targets = members.map(m => m.id).filter(id => id !== userId);
    if (targets.length > 0) await prisma.notification.createMany({ data: targets.map(t => ({ userId: t, actorId: userId!, type: "BROADCAST" })) });

    return NextResponse.json({ ok: true, post });
  } catch (e) {
    console.error("Broadcast error:", e);
    return NextResponse.json({ error: "Failed to broadcast" }, { status: 500 });
  }
}

