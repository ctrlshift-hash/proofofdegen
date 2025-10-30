import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 7);

    // Fetch recent posts and compute a simple score in JS
    const posts = await prisma.post.findMany({
      where: { createdAt: { gte: since } },
      include: {
        user: { select: { id: true, username: true, walletAddress: true, isVerified: true, profileImage: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const ranked = posts
      .map(p => ({
        ...p,
        score: p.likesCount * 2 + p.repostsCount * 3 + p.commentsCount,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 50);

    return NextResponse.json({ posts: ranked });
  } catch (e) {
    console.error("Trending error:", e);
    return NextResponse.json({ error: "Failed to fetch trending" }, { status: 500 });
  }
}

