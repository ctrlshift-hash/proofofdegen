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
    
    // For anonymous users, we'll use a guest user ID
    let userId: string;
    if (session?.user?.id) {
      userId = session.user.id;
    } else {
      // Find or create guest user for anonymous interactions
      let guestUser = await prisma.user.findFirst({
        where: { username: "guest" },
      });

      if (!guestUser) {
        guestUser = await prisma.user.create({
          data: {
            username: "guest",
            email: null,
            password: null,
            isVerified: false,
          },
        });
      }
      userId = guestUser.id;
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

    // Check if user already liked the post
    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: userId,
        },
      },
    });

    if (existingLike) {
      // Unlike the post
      await prisma.like.delete({
        where: { id: existingLike.id },
      });

      // Update like count
      await prisma.post.update({
        where: { id: postId },
        data: { likesCount: { decrement: 1 } },
      });

      return NextResponse.json({ liked: false });
    } else {
      // Like the post
      await prisma.like.create({
        data: {
          postId,
          userId: userId,
        },
      });

      // Update like count
      await prisma.post.update({
        where: { id: postId },
        data: { likesCount: { increment: 1 } },
      });

      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    return NextResponse.json(
      { error: "Failed to toggle like" },
      { status: 500 }
    );
  }
}
