import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const { id } = await params;

    await prisma.channel.update({
      where: { id },
      data: { members: { disconnect: { id: session.user.id } } },
    });

    return NextResponse.json({ joined: false });
  } catch (e) {
    console.error("Leave channel error:", e);
    return NextResponse.json({ error: "Failed to leave channel" }, { status: 500 });
  }
}

