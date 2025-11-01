import { NextRequest, NextResponse } from "next/server";
import { FEATURED_SUGGESTIONS } from "@/lib/featured-users";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const walletHeader = request.headers.get("x-wallet-address") || request.headers.get("X-Wallet-Address");

    // Support both email and wallet authentication
    let userId: string | null = null;

    if (session?.user?.id) {
      userId = session.user.id;
    } else if (walletHeader) {
      const walletUser = await prisma.user.findFirst({ where: { walletAddress: walletHeader } });
      if (walletUser) {
        userId = walletUser.id;
      }
    }

    // Get users that the current user is already following
    const followingIds = userId
      ? (
          await prisma.follow.findMany({
            where: { followerId: userId },
            select: { followingId: true },
          })
        ).map((f) => f.followingId)
      : [];

    // Get suggested users:
    // 1. Users not followed by current user
    // 2. Exclude current user and guest/anonymous users
    // 3. Order by activity (most posts) and recent activity
    const allSuggestions = await prisma.user.findMany({
      where: {
        AND: [
          { id: { notIn: [...followingIds, userId].filter(Boolean) as string[] } },
          { username: { not: { startsWith: "anon_" } } }, // Exclude anonymous users
          { username: { not: "guest" } }, // Exclude guest user
          { username: { not: { startsWith: "anon" } } }, // Exclude anon users
          { profileImage: { not: null } }, // Require profile picture
          // Only show verified (wallet OR email present)
          { OR: [ { walletAddress: { not: null } }, { email: { not: null } } ] },
        ],
      },
      include: {
        _count: {
          select: {
            posts: true,
            followers: true,
          },
        },
        posts: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true },
        },
      },
      orderBy: [
        { posts: { _count: "desc" } },
        { createdAt: "desc" },
      ],
    });

    // Randomly select 3 users from the suggestions (or all if less than 3)
    const shuffled = allSuggestions.sort(() => 0.5 - Math.random());
    let suggestions = shuffled.slice(0, 3);

    // Get follow status for each suggestion
    let suggestionsWithFollowStatus = await Promise.all(
      suggestions.map(async (user) => {
        let isFollowing = false;
        if (userId) {
          const follow = await prisma.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: userId,
                followingId: user.id,
              },
            },
          });
          isFollowing = !!follow;
        }

        return {
          id: user.id,
          username: user.username,
          bio: user.bio,
          profileImage: user.profileImage,
          isVerified: user.isVerified,
          email: user.email,
          walletAddress: user.walletAddress,
          followersCount: user._count.followers,
          postsCount: user._count.posts,
          isFollowing,
        };
      })
    );

    // Prepend featured suggestions (e.g., gold-verified accounts) if not duplicates
    for (const featured of FEATURED_SUGGESTIONS) {
      const exists = suggestionsWithFollowStatus.some(
        (u) => u.username.toLowerCase() === featured.username.toLowerCase()
      );
      if (!exists) {
        suggestionsWithFollowStatus.unshift({
          id: featured.id,
          username: featured.username,
          bio: featured.bio || null,
          profileImage: featured.profileImage,
          isVerified: true,
          email: featured.email || "featured@degenhub.local",
          walletAddress: featured.walletAddress || null,
          followersCount: featured.followersCount || 0,
          postsCount: 0,
          isFollowing: false,
          // extra flag for UI
          isGoldVerified: true as unknown as any,
        } as any);
      }
    }

    return NextResponse.json({ suggestions: suggestionsWithFollowStatus });
  } catch (error: any) {
    console.error("Suggestions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch suggestions", detail: error.message },
      { status: 500 }
    );
  }
}

