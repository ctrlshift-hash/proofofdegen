import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        actor: { select: { id: true, username: true } },
      },
    });

    return NextResponse.json({ notifications });
  } catch (e) {
    console.error("List notifications error:", e);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    const ids: string[] | undefined = body?.ids;

    if (ids && ids.length > 0) {
      await prisma.notification.updateMany({
        where: { userId: session.user.id, id: { in: ids } },
        data: { read: true },
      });
    } else {
      await prisma.notification.updateMany({ where: { userId: session.user.id, read: false }, data: { read: true } });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Mark notifications read error:", e);
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
  }
}

