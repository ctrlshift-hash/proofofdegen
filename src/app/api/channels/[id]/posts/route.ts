import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: channelId } = await params;
    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20"), 1), 50);
    const skip = (page - 1) * limit;

    const posts = await prisma.channelPost.findMany({
      where: { channelId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        user: { select: { id: true, username: true, walletAddress: true, isVerified: true, profileImage: true } },
      },
    });

    return NextResponse.json({ posts, pagination: { page, limit, hasMore: posts.length === limit } });
  } catch (e) {
    console.error("List channel posts error:", e);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: channelId } = await params;

    // find author (session or wallet)
    let userId = session?.user?.id ?? null;
    if (!userId) {
      const wallet = request.headers.get("x-wallet-address") || request.headers.get("X-Wallet-Address");
      if (wallet) {
        const u = await prisma.user.findFirst({ where: { walletAddress: wallet } });
        if (u) userId = u.id;
      }
    }
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    // Must be a member to post
    const member = await prisma.channel.findFirst({ where: { id: channelId, members: { some: { id: userId } } }, select: { id: true } });
    if (!member) return NextResponse.json({ error: "Join channel to post" }, { status: 403 });

    const body = await request.json();
    const content = String(body?.content || "").trim();
    if (!content) return NextResponse.json({ error: "Content required" }, { status: 400 });

    const created = await prisma.channelPost.create({ data: { content, channelId, userId }, include: { user: { select: { id: true, username: true, walletAddress: true, isVerified: true, profileImage: true } } } });

    // Notify other members
    const members = await prisma.user.findMany({ where: { channels: { some: { id: channelId } } }, select: { id: true } });
    const targets = members.map(m => m.id).filter(id => id !== userId);
    if (targets.length > 0) {
      await prisma.notification.createMany({ data: targets.map(t => ({ userId: t, actorId: userId!, type: "CHANNEL_POST" })) });
    }

    return NextResponse.json({ post: created });
  } catch (e) {
    console.error("Create channel post error:", e);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}

