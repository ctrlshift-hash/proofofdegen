import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();
    const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "10"), 1), 50);
    const skip = (page - 1) * limit;

    if (!q) {
      return NextResponse.json({ users: [], pagination: { page, limit, hasMore: false } });
    }

    const users = await prisma.user.findMany({
      where: { username: { contains: q, mode: "insensitive" } },
      select: { id: true, username: true, profileImage: true, isVerified: true },
      orderBy: { username: "asc" },
      skip,
      take: limit,
    });

    return NextResponse.json({
      users,
      pagination: { page, limit, hasMore: users.length === limit },
    });
  } catch (error) {
    console.error("Search users error:", error);
    return NextResponse.json({ error: "Failed to search users" }, { status: 500 });
  }
}
