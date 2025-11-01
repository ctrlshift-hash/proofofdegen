import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const following = await prisma.follow.findMany({
      where: { followerId: id },
      orderBy: { createdAt: "desc" },
      include: { following: { select: { id: true, username: true, profileImage: true, isVerified: true, walletAddress: true } } },
      take: 100,
    });
    return NextResponse.json({ users: following.map(f => f.following) });
  } catch (e) {
    console.error("following list error", e);
    return NextResponse.json({ error: "Failed to fetch following" }, { status: 500 });
  }
}



