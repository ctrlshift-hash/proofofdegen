import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const posts = await prisma.post.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            walletAddress: true,
            isVerified: true,
            profileImage: true,
          },
        },
        _count: {
          select: {
            likes: true,
            reposts: true,
            comments: true,
          },
        },
      },
    });

    // Get user's likes and reposts if authenticated
    const session = await getServerSession(authOptions);
    let userLikes: string[] = [];
    let userReposts: string[] = [];

    if (session?.user?.id) {
      const userInteractions = await prisma.like.findMany({
        where: { userId: session.user.id },
        select: { postId: true },
      });
      userLikes = userInteractions.map(like => like.postId);

      const userRepostData = await prisma.repost.findMany({
        where: { userId: session.user.id },
        select: { postId: true },
      });
      userReposts = userRepostData.map(repost => repost.postId);
    }

    const postsWithInteractions = posts.map(post => ({
      ...post,
      likesCount: post._count.likes,
      repostsCount: post._count.reposts,
      commentsCount: post._count.comments,
      isLiked: userLikes.includes(post.id),
      isReposted: userReposts.includes(post.id),
      _count: undefined,
    }));

    return NextResponse.json({
      posts: postsWithInteractions,
      pagination: {
        page,
        limit,
        hasMore: posts.length === limit,
      },
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { content, imageUrl } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    if (content.length > 500) {
      return NextResponse.json(
        { error: "Content must be 500 characters or less" },
        { status: 400 }
      );
    }

    let userId: string;
    let userData: any;

    if (session?.user?.id) {
      // Authenticated user
      const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
      userId = session.user.id;
      userData = {
        id: session.user.id,
        username: session.user.username || "user",
        walletAddress: dbUser?.walletAddress ?? null,
        isVerified: session.user.isVerified || false,
        profileImage: dbUser?.profileImage ?? null,
      };
    } else {
      // Guest user - create or find a guest user
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
      userData = {
        id: guestUser.id,
        username: "Anonymous",
        walletAddress: null,
        isVerified: false,
        profileImage: null,
      };
    }

    const post = await prisma.post.create({
      data: {
        content: content.trim(),
        imageUrl: imageUrl || null,
        userId: userId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            walletAddress: true,
            isVerified: true,
            profileImage: true,
          },
        },
      },
    });

    return NextResponse.json({
      ...post,
      user: userData, // Use our custom user data
      likesCount: 0,
      repostsCount: 0,
      commentsCount: 0,
      isLiked: false,
      isReposted: false,
    });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
