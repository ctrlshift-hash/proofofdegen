import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true, bio: true, walletAddress: true, isVerified: true, profileImage: true, createdAt: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const posts = await prisma.post.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, username: true, walletAddress: true, isVerified: true, profileImage: true } } },
    });

    return NextResponse.json({ user, posts });
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

    const { profileImage, bio } = await request.json();
    const body = await request.json().catch(() => ({}));
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
