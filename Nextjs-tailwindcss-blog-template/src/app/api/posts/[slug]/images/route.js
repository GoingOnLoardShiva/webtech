import dbConnect from '@/src/lib/mongoose';
import Post from '@/src/models/Post';

export async function POST(req, { params }) {
  const slug = params.slug;
  const body = await req.json();
  const { images = [] } = body; // images: [{ url, alt, public_id }]

  if (!images || images.length === 0) return new Response('No images provided', { status: 400 });

  await dbConnect();
  const post = await Post.findOne({ slug });
  if (!post) return new Response('Not found', { status: 404 });

  post.images = post.images || [];
  for (const img of images) {
    post.images.push(img);
  }

  await post.save();
  return new Response(JSON.stringify(post), { status: 200 });
}