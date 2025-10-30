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
    const { id } = await params;

    // authorize: session owner or wallet header match
    let allowed = !!(session?.user?.id && session.user.id === id);
    if (!allowed) {
      const wallet = request.headers.get("x-wallet-address") || request.headers.get("X-Wallet-Address");
      if (wallet) {
        const target = await prisma.user.findUnique({ where: { id }, select: { id: true, walletAddress: true } });
        if (target?.walletAddress && target.walletAddress === wallet) allowed = true;
      }
    }
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const form = await request.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "file is required" }, { status: 400 });

    const maxBytes = 2 * 1024 * 1024; // 2MB
    if (file.size > maxBytes) return NextResponse.json({ error: "File too large (max 2MB)" }, { status: 413 });

    const type = file.type || "image/png";
    const buf = Buffer.from(await file.arrayBuffer());
    const base64 = buf.toString("base64");
    const dataUrl = `data:${type};base64,${base64}`;

    await prisma.user.update({ where: { id }, data: { profileImage: dataUrl } });
    return NextResponse.json({ ok: true, url: dataUrl });
  } catch (e) {
    console.error("Upload avatar error:", e);
    return NextResponse.json({ error: "Failed to upload" }, { status: 500 });
  }
}


