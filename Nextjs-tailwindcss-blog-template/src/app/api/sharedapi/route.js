import { NextResponse } from "next/server";
import ConnectDb from "@/src/lib/mongoose";
import Post from "@/src/models/Post";

export async function GET(req) {
  try {
    const apiKey = req.headers.get("x-api-key");
    const BLOG_SHARED_API_KEY ="ren_555_snjj_A08"


    if (!apiKey) {
      return NextResponse.json({ error: "Missing API key" }, { status: 400 });
    }

    if (apiKey !== BLOG_SHARED_API_KEY) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    await ConnectDb();

    const post = await Post.findOne()
      .sort({ createdAt: -1 })
      .select("title slug content createdAt author image");

    if (!post) {
      return NextResponse.json({ error: "No post found" }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (err) {
    console.error("Shared API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
