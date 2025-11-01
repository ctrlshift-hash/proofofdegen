import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "likes"; // likes | reposts | comments
    const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20"), 1), 50);
    const skip = (page - 1) * limit;

    if (type === "likes") {
      const items = await prisma.like.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: { post: { include: { user: { select: { id: true, username: true, walletAddress: true, isVerified: true, profileImage: true } }, _count: { select: { likes: true, reposts: true, comments: true } } } } },
      });
      const posts = items.map(i => ({
        ...i.post,
        likesCount: i.post._count.likes,
        repostsCount: i.post._count.reposts,
        commentsCount: i.post._count.comments,
        _count: undefined,
      }));
      return NextResponse.json({ posts, pagination: { page, limit, hasMore: items.length === limit } });
    }

    if (type === "reposts") {
      const items = await prisma.repost.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: { post: { include: { user: { select: { id: true, username: true, walletAddress: true, isVerified: true, profileImage: true } }, _count: { select: { likes: true, reposts: true, comments: true } } } } },
      });
      const posts = items.map(i => ({
        ...i.post,
        likesCount: i.post._count.likes,
        repostsCount: i.post._count.reposts,
        commentsCount: i.post._count.comments,
        _count: undefined,
      }));
      return NextResponse.json({ posts, pagination: { page, limit, hasMore: items.length === limit } });
    }

    // comments: return posts the user commented on (distinct)
    const comments = await prisma.comment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: { post: { include: { user: { select: { id: true, username: true, walletAddress: true, isVerified: true, profileImage: true } }, _count: { select: { likes: true, reposts: true, comments: true } } } } },
    });
    const seen = new Set<string>();
    const posts = comments.filter(c => { if (seen.has(c.postId)) return false; seen.add(c.postId); return true; }).map(i => ({
      ...i.post,
      likesCount: i.post._count.likes,
      repostsCount: i.post._count.reposts,
      commentsCount: i.post._count.comments,
      _count: undefined,
    }));
    return NextResponse.json({ posts, pagination: { page, limit, hasMore: comments.length === limit } });
  } catch (e) {
    console.error("User activity error", e);
    return NextResponse.json({ error: "Failed to fetch user activity" }, { status: 500 });
  }
}


