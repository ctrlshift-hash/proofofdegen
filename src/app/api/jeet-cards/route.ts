import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const dir = path.join(process.cwd(), "public", "jeet-cards");
    await fs.mkdir(dir, { recursive: true });
    const ext = file.type === "image/jpeg" ? ".jpg" : ".png";
    const filename = `card-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const filepath = path.join(dir, filename);
    await fs.writeFile(filepath, buffer);

    const publicPath = `/jeet-cards/${filename}`;
    const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
    const origin = configured || new URL(request.url).origin;
    const absoluteUrl = `${origin}${publicPath}`;
    return NextResponse.json({ url: absoluteUrl, path: publicPath });
  } catch (e: any) {
    return NextResponse.json({ error: "Failed to save image", detail: e?.message }, { status: 500 });
  }
}


