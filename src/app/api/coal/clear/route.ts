import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Not allowed in production" }, { status: 403 });
    }
    const res = await prisma.post.deleteMany({
      where: {
        content: { contains: "#coal", mode: "insensitive" },
      },
    });
    return NextResponse.json({ ok: true, deleted: res.count });
  } catch (e) {
    console.error("Coal clear error", e);
    return NextResponse.json({ error: "Failed to clear" }, { status: 500 });
  }
}


