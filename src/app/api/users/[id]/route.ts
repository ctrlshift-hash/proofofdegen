import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FEATURED_SUGGESTIONS } from "@/lib/featured-users";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Featured virtual profiles (e.g., Alon)
    const featured = FEATURED_SUGGESTIONS.find((f) => f.id === id);
    if (featured) {
      const user = {
        id: featured.id,
        username: featured.username,
        bio: featured.bio ?? null,
        walletAddress: featured.walletAddress ?? null,
        email: featured.email ?? null,
        isVerified: true,
        profileImage: featured.profileImage,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString(),
        followerCount: featured.followersCount ?? 0,
        followingCount: 0,
      } as any;

      const now = Date.now();
      const make = (i: number, hoursAgo: number, content: string, likes = 300 + Math.floor(Math.random()*1500), reposts = 50 + Math.floor(Math.random()*400), comments = 10 + Math.floor(Math.random()*80)) => ({
        id: `${featured.id}-p${i}`,
        content,
        imageUrls: [],
        likesCount: likes,
        downvotesCount: Math.floor(Math.random()*8),
        repostsCount: reposts,
        commentsCount: comments,
        createdAt: new Date(now - hoursAgo * 60 * 60 * 1000).toISOString(),
        user: {
          id: featured.id,
          username: featured.username,
          walletAddress: featured.walletAddress ?? undefined,
          isVerified: true,
          profileImage: featured.profileImage,
        },
      });

      const posts = [
        make(1, 2, "gm – shipping never stops. internet capital markets don’t sleep. @pumpdotfun"),
        make(2, 6, "Padreapp testflight is humming. distribution > anything. creators deserve better rails."),
        make(3, 11, "if you’re building: ship weekly, talk daily, iterate hourly."),
        make(4, 18, "internet capital markets = global, 24/7, permissionless. we’re still early."),
        make(5, 26, "@pumpdotfun experiments are a playground for coordination energy."),
        make(6, 34, "Padreapp: lightweight tooling for onchain communities. less noise, more signal."),
        make(7, 42, "founders: focus your loop: build → post → feedback → fix → repeat."),
        make(8, 50, "internet-native go-to-market is community-first. distribution compounds."),
        make(9, 60, "gm | markets vibing. memes price in future coordination."),
        make(10, 72, "Padreapp shipping notes: speed, simplicity, shareability."),
        make(11, 84, "infra matters but UX wins. abstract the chain, keep the magic."),
        make(12, 96, "internet capital markets turn ideas into assets at the speed of posts."),
        make(13, 120, "@pumpdotfun weekend hackathon? reply if you’re in."),
        make(14, 144, "creators aren’t just posting—they’re raising, rewarding, and coordinating."),
        make(15, 168, "Padreapp update: notifications tuned, posting flow faster, cleaner UI."),
        make(16, 192, "gm | ship, learn, repeat. see you onchain."),
        make(17, 216, "the internet is the cap table now. welcome to internet capital markets."),
        make(18, 240, "open to collabs: tools that help communities coordinate value."),
        make(19, 264, "Padreapp x @pumpdotfun: creators->markets loop getting tighter."),
        make(20, 336, "execution > opinions. log your work publicly, let compounding do the rest."),
      ];

      return NextResponse.json({ user, posts });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true, bio: true, walletAddress: true, email: true, isVerified: true, profileImage: true, createdAt: true,
        _count: { select: { followers: true, following: true } }
      },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const posts = await prisma.post.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, username: true, walletAddress: true, isVerified: true, profileImage: true } } },
    });

    return NextResponse.json({ user: { ...user, followerCount: user._count?.followers ?? 0, followingCount: user._count?.following ?? 0, _count: undefined }, posts });
  } catch (e) {
    console.error("Fetch user error:", e);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    // Allow via session
    let allowed = !!(session?.user?.id && session.user.id === id);

    // Or via wallet header match
    if (!allowed) {
      const wallet = request.headers.get("x-wallet-address") || request.headers.get("X-Wallet-Address");
      if (wallet) {
        const target = await prisma.user.findUnique({ where: { id }, select: { id: true, walletAddress: true } });
        if (target?.walletAddress && target.walletAddress === wallet) allowed = true;
      }
    }

    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({} as any));
    const updates: any = {};
    if (body.profileImage !== undefined) updates.profileImage = body.profileImage ?? undefined;
    if (body.bio !== undefined) updates.bio = body.bio ?? undefined;
    if (body.username !== undefined) {
      const candidate = String(body.username || "").trim();
      const re = /^[a-zA-Z0-9_]{3,20}$/;
      if (!re.test(candidate)) return NextResponse.json({ error: "Invalid username. Use 3-20 letters, numbers, or _" }, { status: 400 });
      const exists = await prisma.user.findUnique({ where: { username: candidate } });
      if (exists && exists.id !== id) return NextResponse.json({ error: "Username already taken" }, { status: 409 });
      updates.username = candidate;
    }

    const updated = await prisma.user.update({ where: { id }, data: updates });
    return NextResponse.json({ ok: true, user: { id: updated.id, profileImage: updated.profileImage, bio: updated.bio, username: updated.username } });
  } catch (e) {
    console.error("Update user error:", e);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
