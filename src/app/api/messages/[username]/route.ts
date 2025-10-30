import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getOrCreateConversation(meId: string, otherId: string) {
  const [a, b] = meId < otherId ? [meId, otherId] : [otherId, meId];
  let convo = await prisma.conversation.findUnique({
    where: { participantAId_participantBId: { participantAId: a, participantBId: b } },
  });
  if (!convo) {
    convo = await prisma.conversation.create({ data: { participantAId: a, participantBId: b } });
  }
  return convo;
}

async function resolveSenderFromRequestGET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) return { userId: session.user.id };
  const walletHeader = request.headers.get("x-wallet-address") || request.headers.get("X-Wallet-Address");
  if (walletHeader) {
    let u = await prisma.user.findFirst({ where: { walletAddress: walletHeader } });
    if (!u) {
      const anonName = `anon_${walletHeader.slice(0, 6)}`;
      u = await prisma.user.create({ data: { username: anonName, walletAddress: walletHeader, isVerified: true } });
    }
    return { userId: u.id };
  }
  return { userId: null };
}

async function resolveSenderFromRequestPOST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) return { userId: session.user.id };
  try {
    const body = await request.clone().json().catch(() => ({} as any));
    const walletAddress = body?.walletAddress as string | undefined;
    if (walletAddress) {
      let u = await prisma.user.findFirst({ where: { walletAddress } });
      if (!u) {
        const anonName = `anon_${walletAddress.slice(0, 6)}`;
        u = await prisma.user.create({ data: { username: anonName, walletAddress, isVerified: true } });
      }
      return { userId: u.id };
    }
  } catch {}
  return { userId: null };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { userId } = await resolveSenderFromRequestGET(request);
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const { username } = await params;

    const other = await prisma.user.findUnique({ where: { username } });
    if (!other) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (other.id === userId) return NextResponse.json({ error: "Cannot DM yourself" }, { status: 400 });

    const convo = await getOrCreateConversation(userId, other.id);
    const messages = await prisma.message.findMany({
      where: { conversationId: convo.id },
      orderBy: { createdAt: "asc" },
      include: { sender: { select: { id: true, username: true } }, recipient: { select: { id: true, username: true } } },
    });

    return NextResponse.json({ conversationId: convo.id, withUser: { id: other.id, username: other.username }, messages });
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
    const { userId } = await resolveSenderFromRequestPOST(request);
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { username } = await params;
    const { content } = await request.json();
    if (!content || !content.trim()) return NextResponse.json({ error: "Message content is required" }, { status: 400 });

    const other = await prisma.user.findUnique({ where: { username } });
    if (!other) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (other.id === userId) return NextResponse.json({ error: "Cannot DM yourself" }, { status: 400 });

    const convo = await getOrCreateConversation(userId, other.id);
    const message = await prisma.message.create({
      data: { conversationId: convo.id, senderId: userId, recipientId: other.id, content: content.trim() },
      include: { sender: { select: { id: true, username: true } }, recipient: { select: { id: true, username: true } } },
    });

    await prisma.notification.create({ data: { userId: other.id, actorId: userId, type: "MESSAGE", messageId: message.id } });

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
