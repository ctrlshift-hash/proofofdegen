import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function extractHashtags(text: string): string[] {
  const hashtagRegex = /#[\w]+/g;
  const matches = text.match(hashtagRegex) || [];
  return [...new Set(matches.map(h => h.toLowerCase()))];
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get("period") || "week"; // today, week, month, all

    const since = new Date();
    switch (period) {
      case "today":
        since.setHours(0, 0, 0, 0);
        break;
      case "week":
        since.setDate(since.getDate() - 7);
        break;
      case "month":
        since.setDate(since.getDate() - 30);
        break;
      case "all":
        since.setFullYear(2000);
        break;
    }

    // Fetch recent posts with hashtags
    const posts = await prisma.post.findMany({
      where: { 
        createdAt: { gte: since },
        content: { contains: "#" }
      },
      include: {
        user: { select: { id: true, username: true, walletAddress: true, isVerified: true, profileImage: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    const now = Date.now();
    
    // Group posts by hashtag and calculate trending scores
    const hashtagMap = new Map<string, {
      hashtag: string;
      posts: any[];
      totalScore: number;
      postCount: number;
      latestPost: any;
    }>();

    posts.forEach((p) => {
      const hashtags = extractHashtags(p.content);
      const baseScore = p.likesCount * 2 + p.repostsCount * 3 + p.commentsCount * 1.5;
      const postAge = now - new Date(p.createdAt).getTime();
      const hoursOld = postAge / (1000 * 60 * 60);
      const decayFactor = Math.max(0.1, Math.exp(-hoursOld * 0.05));
      const recencyBoost = hoursOld < 1 ? 2 : hoursOld < 6 ? 1.5 : hoursOld < 24 ? 1.2 : 1;
      const trendingScore = baseScore * decayFactor * recencyBoost;

      const postWithScore = {
        ...p,
        score: trendingScore,
        baseScore,
      };

      hashtags.forEach((tag) => {
        const existing = hashtagMap.get(tag);
        if (existing) {
          existing.posts.push(postWithScore);
          existing.totalScore += trendingScore;
          existing.postCount += 1;
          // Keep the most recent post as latest
          if (new Date(p.createdAt) > new Date(existing.latestPost.createdAt)) {
            existing.latestPost = postWithScore;
          }
        } else {
          hashtagMap.set(tag, {
            hashtag: tag,
            posts: [postWithScore],
            totalScore: trendingScore,
            postCount: 1,
            latestPost: postWithScore,
          });
        }
      });
    });

    // Convert to array and rank by total score
    const ranked = Array.from(hashtagMap.values())
      .filter(h => h.postCount >= 1) // At least 1 post with this hashtag
      .map((h, idx) => ({
        ...h,
        rank: idx + 1,
      }))
      .sort((a, b) => b.totalScore - a.totalScore)
      .map((h, idx) => ({ ...h, rank: idx + 1 }))
      .slice(0, 50);

    return NextResponse.json({ hashtags: ranked });
  } catch (e) {
    console.error("Trending error:", e);
    return NextResponse.json({ error: "Failed to fetch trending" }, { status: 500 });
  }
}

