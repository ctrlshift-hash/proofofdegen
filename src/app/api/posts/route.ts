import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function extractHashtags(text: string): string[] {
  const hashtagRegex = /#[\w]+/g;
  const matches = text.match(hashtagRegex) || [];
  return [...new Set(matches.map(h => h.toLowerCase()))];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;
    const hashtag = searchParams.get("hashtag");

    // Bot usernames to exclude from feed
    const botUsernames = [
      "cryptodegen",
      "pumpsignal",
      "solbuilder",
      "nftcollector",
      "tradingalpha",
      "degenshark",
      "web3teacher",
      "memecoinking",
      "solstaker",
      "artblockchain",
    ];

    let whereClause: any = {
      user: {
        username: {
          notIn: botUsernames,
        },
      },
    };
    
    // Filter by hashtag if provided
    if (hashtag) {
      // Prisma doesn't support regex directly, so we'll filter after fetching
      // This is less efficient but works for now
      whereClause = {
        ...whereClause,
        content: { contains: "#" },
      };
    }

    const posts = await prisma.post.findMany({
      skip,
      take: hashtag ? 500 : limit, // Fetch more if filtering by hashtag
      orderBy: { createdAt: "desc" },
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
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

    // Filter by hashtag in memory if needed
    let filteredPosts = posts;
    if (hashtag) {
      const normalizedHashtag = hashtag.toLowerCase().startsWith("#") 
        ? hashtag.toLowerCase() 
        : `#${hashtag.toLowerCase()}`;
      filteredPosts = posts.filter(post => {
        const postHashtags = extractHashtags(post.content);
        return postHashtags.includes(normalizedHashtag);
      });
      // Apply pagination after filtering
      filteredPosts = filteredPosts.slice(skip, skip + limit);
    }

    // Get user's likes and reposts if authenticated
    const session = await getServerSession(authOptions);
    let userLikes: string[] = [];
    let userReposts: string[] = [];
    let userDownvotes: string[] = [];

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

      try {
        const userDownvoteData = await prisma.downvote.findMany({
          where: { userId: session.user.id },
          select: { postId: true },
        });
        userDownvotes = userDownvoteData.map(d => d.postId);
      } catch {}
    }

    const postsWithInteractions = filteredPosts.map(post => ({
      ...post,
      likesCount: post._count.likes,
      repostsCount: post._count.reposts,
      commentsCount: post._count.comments,
      isLiked: userLikes.includes(post.id),
      isReposted: userReposts.includes(post.id),
      isDownvoted: userDownvotes.includes(post.id),
      _count: undefined,
    }));

    return NextResponse.json({
      posts: postsWithInteractions,
      pagination: {
        page,
        limit,
        hasMore: filteredPosts.length === limit,
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
    const { content, imageUrl, imageUrls, walletAddress } = await request.json();

    // Support both single imageUrl (backwards compat) and array of imageUrls
    const images = imageUrls || (imageUrl ? [imageUrl] : []);
    
    // Allow posting with just images (no text required)
    const hasContent = content && content.trim().length > 0;
    const hasImages = images.length > 0;
    
    if (!hasContent && !hasImages) {
      return NextResponse.json(
        { error: "Post must have either content or images" },
        { status: 400 }
      );
    }

    if (hasContent && content.length > 500) {
      return NextResponse.json(
        { error: "Content must be 500 characters or less" },
        { status: 400 }
      );
    }

    if (images.length > 4) {
      return NextResponse.json(
        { error: "Maximum 4 images per post" },
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
    } else if (walletAddress) {
      // Wallet-only guest: find or create a pseudo user tied to wallet
      let walletUser = await prisma.user.findFirst({ where: { walletAddress } });
      if (!walletUser) {
        const anonName = `anon_${walletAddress.slice(0, 6)}`;
        walletUser = await prisma.user.create({
          data: { username: anonName, walletAddress, email: null, password: null, isVerified: true },
        });
      }
      userId = walletUser.id;
      userData = {
        id: walletUser.id,
        username: walletUser.username,
        walletAddress: walletUser.walletAddress,
        isVerified: walletUser.isVerified,
        profileImage: walletUser.profileImage ?? null,
      };
    } else {
      // Guest user - create or find a guest user
      let guestUser = await prisma.user.findFirst({
        where: { username: "guest" },
      });
      if (!guestUser) {
        guestUser = await prisma.user.create({
          data: { username: "guest", email: null, password: null, isVerified: false },
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
        content: (content || "").trim(),
        imageUrls: images,
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
      user: userData,
      likesCount: 0,
      repostsCount: 0,
      commentsCount: 0,
      isLiked: false,
      isReposted: false,
    });
  } catch (error: any) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Failed to create post", detail: (error?.message || String(error)) },
      { status: 500 }
    );
  }
}
