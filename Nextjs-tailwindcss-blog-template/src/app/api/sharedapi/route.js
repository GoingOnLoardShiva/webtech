// webnews-psi project: api/sharedapi/route.js
export async function GET(req) {
  try {
    const apiKey = req.headers.get("x-api-key");
    const BLOG_SHARED_API_KEY = "ren_555_snjj_A08";

    // 1. Check API Key
    if (apiKey !== BLOG_SHARED_API_KEY) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401,
        headers: { "Content-Type": "application/json" } 
      });
    }

    await ConnectDb();

    const post = await Post.find()
      .sort({ createdAt: -1 })
      .select("title slug content createdAt author image")
      .lean(); // .lean() makes the query faster and lighter

    // 2. Add CORS Headers so other sites can fetch it
    return new Response(JSON.stringify({ post }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*", // Allow all domains to request this
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, x-api-key",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Server Error" }), { status: 500 });
  }
}