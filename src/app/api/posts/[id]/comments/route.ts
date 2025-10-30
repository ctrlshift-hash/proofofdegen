import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;

    const comments = await prisma.comment.findMany({
      where: { postId },
      include: { user: { select: { id: true, username: true, walletAddress: true, isVerified: true, profileImage: true } } },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: postId } = await params;
    const { content } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    let userId: string;
    let userData: any;

    if (session?.user?.id) {
      // Authenticated user
      userId = session.user.id;
      userData = { id: session.user.id, username: session.user.username || "user", walletAddress: null, isVerified: session.user.isVerified || false, profileImage: null };
    } else {
      // Guest user
      let guestUser = await prisma.user.findFirst({ where: { username: "guest" } });
      if (!guestUser) {
        guestUser = await prisma.user.create({ data: { username: "guest", email: null, password: null, isVerified: false } });
      }
      userId = guestUser.id;
      userData = { id: guestUser.id, username: "Anonymous", walletAddress: null, isVerified: false, profileImage: null };
    }

    const comment = await prisma.comment.create({
      data: { content: content.trim(), postId, userId },
      include: { user: { select: { id: true, username: true, walletAddress: true, isVerified: true, profileImage: true } } },
    });

    return NextResponse.json({ ...comment, user: userData });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: postId } = await params;
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get("commentId");
    if (!commentId) return NextResponse.json({ error: "commentId required" }, { status: 400 });

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment || comment.postId !== postId) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let allowed = !!(session?.user?.id && session.user.id === comment.userId);
    if (!allowed) {
      const wallet = request.headers.get("x-wallet-address") || request.headers.get("X-Wallet-Address");
      if (wallet) {
        const owner = await prisma.user.findUnique({ where: { id: comment.userId }, select: { walletAddress: true } });
        if (owner?.walletAddress && owner.walletAddress === wallet) allowed = true;
      }
    }
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.comment.delete({ where: { id: commentId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete comment error:", error);
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}
