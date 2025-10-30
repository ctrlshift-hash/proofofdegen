import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getOrCreateConversation(meId: string, otherId: string) {
  // enforce sorted pairing to satisfy unique(participantAId, participantBId)
  const [a, b] = meId < otherId ? [meId, otherId] : [otherId, meId];
  let convo = await prisma.conversation.findUnique({
    where: { participantAId_participantBId: { participantAId: a, participantBId: b } },
  });
  if (!convo) {
    convo = await prisma.conversation.create({
      data: { participantAId: a, participantBId: b },
    });
  }
  return convo;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const { username } = await params;

    const meId = session.user.id;
    const other = await prisma.user.findUnique({ where: { username } });
    if (!other) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (other.id === meId) return NextResponse.json({ error: "Cannot DM yourself" }, { status: 400 });

    const convo = await getOrCreateConversation(meId, other.id);

    const messages = await prisma.message.findMany({
      where: { conversationId: convo.id },
      orderBy: { createdAt: "asc" },
      include: {
        sender: { select: { id: true, username: true } },
        recipient: { select: { id: true, username: true } },
      },
    });

    return NextResponse.json({
      conversationId: convo.id,
      withUser: { id: other.id, username: other.username },
      messages,
    });
  } catch (error) {
    console.error("Fetch thread error:", error);
    return NextResponse.json({ error: "Failed to fetch thread" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const { username } = await params;
    const { content } = await request.json();
    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    const meId = session.user.id;
    const other = await prisma.user.findUnique({ where: { username } });
    if (!other) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (other.id === meId) return NextResponse.json({ error: "Cannot DM yourself" }, { status: 400 });

    const convo = await getOrCreateConversation(meId, other.id);

    const message = await prisma.message.create({
      data: {
        conversationId: convo.id,
        senderId: meId,
        recipientId: other.id,
        content: content.trim(),
      },
      include: {
        sender: { select: { id: true, username: true } },
        recipient: { select: { id: true, username: true } },
      },
    });

    // Create notification for the recipient
    await prisma.notification.create({
      data: {
        userId: other.id,
        actorId: meId,
        type: "MESSAGE",
        messageId: message.id,
      },
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
