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
    const { id: postId } = await params;

    // Support both email and wallet authentication
    let userId: string | null = null;
    if (session?.user?.id) {
      userId = session.user.id;
    } else {
      const walletHeader = request.headers.get("x-wallet-address") || request.headers.get("X-Wallet-Address");
      if (walletHeader) {
        let walletUser = await prisma.user.findFirst({ where: { walletAddress: walletHeader } });
        if (!walletUser) {
          walletUser = await prisma.user.create({ data: { username: `anon_${walletHeader.slice(0,6)}`, walletAddress: walletHeader, isVerified: true } });
        }
        userId = walletUser.id;
      } else {
        let guestUser = await prisma.user.findFirst({ where: { username: "guest" } });
        if (!guestUser) {
          guestUser = await prisma.user.create({ data: { username: "guest" } });
        }
        userId = guestUser.id;
      }
    }

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    const existing = await prisma.downvote.findUnique({ where: { postId_userId: { postId, userId: userId! } } });
    if (existing) {
      await prisma.downvote.delete({ where: { id: existing.id } });
      await prisma.post.update({ where: { id: postId }, data: { downvotesCount: { decrement: 1 } } });
      return NextResponse.json({ downvoted: false });
    } else {
      await prisma.downvote.create({ data: { postId, userId: userId! } });
      await prisma.post.update({ where: { id: postId }, data: { downvotesCount: { increment: 1 } } });
      return NextResponse.json({ downvoted: true });
    }
  } catch (e) {
    console.error("Downvote error", e);
    return NextResponse.json({ error: "Failed to toggle downvote" }, { status: 500 });
  }
}


