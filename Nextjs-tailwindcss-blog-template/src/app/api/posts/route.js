import dbConnect from '@/src/lib/mongoose';
import Post from '@/src/models/Post';
import { getToken } from 'next-auth/jwt';

export async function GET(req) {
  await dbConnect();
  const url = new URL(req.url);
  const tag = url.searchParams.get('tag');
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // If authenticated show all posts (for admin/dashboard), otherwise only published
  const q = token ? (tag ? { tags: tag } : {}) : (tag ? { tags: tag, isPublished: true } : { isPublished: true });
  const posts = await Post.find(q).sort({ publishedAt: -1 }).select('-content');
  return new Response(JSON.stringify(posts), { status: 200 });
}

export async function POST(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return new Response('Unauthorized', { status: 401 });

  const body = await req.json();
  const { title, slug, content, excerpt, description, image, tags = [], isPublished } = body;

  if (!title || !slug) return new Response('Title and slug are required', { status: 422 });

  await dbConnect();
  const existing = await Post.findOne({ slug });
  if (existing) return new Response('Slug already exists', { status: 409 });

  const post = new Post({ title, slug, content, excerpt, description, image, tags, isPublished: !!isPublished, publishedAt: isPublished ? new Date() : null, author: token.id });
  await post.save();

  return new Response(JSON.stringify(post), { status: 201 });
}