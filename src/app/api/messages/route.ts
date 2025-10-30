import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = session.user.id;

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ participantAId: userId }, { participantBId: userId }],
      },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            sender: { select: { id: true, username: true } },
            recipient: { select: { id: true, username: true } },
          },
        },
        participantA: { select: { id: true, username: true } },
        participantB: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = conversations.map(c => {
      const meIsA = c.participantAId === userId;
      const other = meIsA ? c.participantB : c.participantA;
      const lastMessage = c.messages[0] ?? null;
      return {
        id: c.id,
        withUser: other,
        lastMessage,
        createdAt: c.createdAt,
      };
    });

    return NextResponse.json({ conversations: formatted });
  } catch (error) {
    console.error("List conversations error:", error);
    return NextResponse.json({ error: "Failed to list conversations" }, { status: 500 });
  }
}
