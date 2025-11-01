import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "today"; // today|week
    const now = new Date();
    const start = new Date(now);
    if (period === "week") {
      start.setDate(now.getDate() - 7);
    } else {
      start.setDate(now.getDate() - 1);
    }

    const posts = await prisma.post.findMany({
      where: {
        content: { contains: "#coal", mode: "insensitive" },
        createdAt: { gte: start },
      },
      orderBy: [{ likesCount: "desc" }, { createdAt: "desc" }],
      include: { user: { select: { id: true, username: true, profileImage: true, isVerified: true } } },
      take: 5,
    });

    return NextResponse.json({ posts });
  } catch (e) {
    console.error("Top coal error", e);
    return NextResponse.json({ error: "Failed to fetch top coal" }, { status: 500 });
  }
}


