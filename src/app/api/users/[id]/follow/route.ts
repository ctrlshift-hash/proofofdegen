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
    const { id: targetUserId } = await params;

    // Support both email and wallet authentication
    let userId: string | null = null;
    let actorId: string | null = null;

    if (session?.user?.id) {
      userId = session.user.id;
      actorId = session.user.id;
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
        actorId = walletUser.id;
      } else {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }
    }

    if (!userId || userId === targetUserId) {
      return NextResponse.json(
        { error: "Cannot follow yourself" },
        { status: 400 }
      );
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: targetUserId,
        },
      },
    });

    if (existingFollow) {
      return NextResponse.json({ message: "Already following", following: true });
    }

    // Create follow relationship
    await prisma.follow.create({
      data: {
        followerId: userId,
        followingId: targetUserId,
      },
    });

    // Create notification
    if (actorId && actorId !== targetUserId) {
      await prisma.notification.create({
        data: {
          type: "FOLLOW",
          userId: targetUserId,
          actorId: actorId,
        },
      });
    }

    return NextResponse.json({ message: "Followed successfully", following: true });
  } catch (error: any) {
    console.error("Follow error:", error);
    return NextResponse.json(
      { error: "Failed to follow user", detail: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: targetUserId } = await params;

    // Support both email and wallet authentication
    let userId: string | null = null;

    if (session?.user?.id) {
      userId = session.user.id;
    } else {
      const walletHeader = request.headers.get("x-wallet-address") || request.headers.get("X-Wallet-Address");
      if (walletHeader) {
        const walletUser = await prisma.user.findFirst({ where: { walletAddress: walletHeader } });
        if (!walletUser) {
          return NextResponse.json(
            { error: "User not found" },
            { status: 404 }
          );
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

    // Delete follow relationship
    await prisma.follow.deleteMany({
      where: {
        followerId: userId,
        followingId: targetUserId,
      },
    });

    return NextResponse.json({ message: "Unfollowed successfully", following: false });
  } catch (error: any) {
    console.error("Unfollow error:", error);
    return NextResponse.json(
      { error: "Failed to unfollow user", detail: error.message },
      { status: 500 }
    );
  }
}


