import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const followers = await prisma.follow.findMany({
      where: { followingId: id },
      orderBy: { createdAt: "desc" },
      include: { follower: { select: { id: true, username: true, profileImage: true, isVerified: true, walletAddress: true } } },
      take: 100,
    });
    return NextResponse.json({ users: followers.map(f => f.follower) });
  } catch (e) {
    console.error("followers list error", e);
    return NextResponse.json({ error: "Failed to fetch followers" }, { status: 500 });
  }
}



