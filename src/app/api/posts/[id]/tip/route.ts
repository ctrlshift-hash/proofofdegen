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
    const body = await request.json();
    const { amount, transactionSignature } = body;

    // Support both email and wallet authentication
    let userId: string | null = null;

    if (session?.user?.id) {
      userId = session.user.id;
    } else {
      const walletHeader = request.headers.get("x-wallet-address") || request.headers.get("X-Wallet-Address");
      if (walletHeader) {
        let walletUser = await prisma.user.findFirst({ where: { walletAddress: walletHeader } });
        if (!walletUser) {
          const anonName = `anon_${walletHeader.slice(0, 6)}`;
          walletUser = await prisma.user.create({
            data: { username: anonName, walletAddress: walletHeader, isVerified: true },
          });
        }
        userId = walletUser.id;
      } else {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if post exists and get the author
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { user: true },
    });

    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    if (post.userId === userId) {
      return NextResponse.json(
        { error: "Cannot tip your own post" },
        { status: 400 }
      );
    }

    // Validate amount
    const tipAmount = amount ? parseFloat(amount.toString()) : 0.1; // Default 0.1 SOL if not provided
    if (tipAmount <= 0) {
      return NextResponse.json(
        { error: "Invalid tip amount" },
        { status: 400 }
      );
    }

    // Check if transaction signature already exists (prevent double-spending)
    if (transactionSignature) {
      const existingTip = await prisma.tip.findUnique({
        where: { transactionSignature },
      });

      if (existingTip) {
        return NextResponse.json(
          { error: "Transaction already processed" },
          { status: 400 }
        );
      }
    }

    // Create tip record
    const tip = await prisma.tip.create({
      data: {
        amount: tipAmount,
        transactionSignature: transactionSignature || null,
        fromUserId: userId,
        toUserId: post.userId,
        postId: postId,
      },
      include: {
        fromUser: {
          select: {
            id: true,
            username: true,
            profileImage: true,
          },
        },
        toUser: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    // Create notification for the recipient
    await prisma.notification.create({
      data: {
        type: "TIP",
        userId: post.userId,
        actorId: userId,
        postId: postId,
      },
    });

    return NextResponse.json({
      message: "Tip sent successfully",
      tip: {
        id: tip.id,
        amount: tip.amount,
        fromUser: tip.fromUser,
        toUser: tip.toUser,
      },
    });
  } catch (error: any) {
    console.error("Tip error:", error);
    return NextResponse.json(
      { error: "Failed to send tip", detail: error.message },
      { status: 500 }
    );
  }
}

