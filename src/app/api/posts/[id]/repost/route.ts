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
    let actorId: string | null = null; // The user performing the action (for notifications)
    
    if (session?.user?.id) {
      userId = session.user.id;
      actorId = session.user.id;
    } else {
      // Check for wallet authentication
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
        // Guest user for anonymous interactions (no notifications)
        let guestUser = await prisma.user.findFirst({ where: { username: "guest" } });
        if (!guestUser) {
          guestUser = await prisma.user.create({
            data: { username: "guest", email: null, password: null, isVerified: false },
          });
        }
        userId = guestUser.id;
        // actorId stays null for guests (no notifications)
      }
    }

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    // Check if user already reposted
    const existingRepost = await prisma.repost.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: userId,
        },
      },
    });

    if (existingRepost) {
      // Unrepost
      await prisma.repost.delete({
        where: { id: existingRepost.id },
      });

      // Update repost count
      await prisma.post.update({
        where: { id: postId },
        data: { repostsCount: { decrement: 1 } },
      });

      return NextResponse.json({ reposted: false });
    } else {
      // Repost
      await prisma.repost.create({
        data: {
          postId,
          userId: userId,
        },
      });

      // Update repost count
      await prisma.post.update({
        where: { id: postId },
        data: { repostsCount: { increment: 1 } },
      });

      // Create notification if actor is authenticated (email or wallet) and not reposting own post
      if (actorId) {
        const postOwner = post.userId;
        if (postOwner !== actorId) {
          await prisma.notification.create({
            data: {
              userId: postOwner,
              actorId: actorId,
              type: "REPOST",
              postId,
            },
          });
        }
      }

      return NextResponse.json({ reposted: true });
    }
  } catch (error) {
    console.error("Error toggling repost:", error);
    return NextResponse.json(
      { error: "Failed to toggle repost" },
      { status: 500 }
    );
  }
}
