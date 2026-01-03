import dbConnect from '@/src/lib/mongoose';
import Post from '@/src/models/Post';
import { getToken } from 'next-auth/jwt';

export async function GET(req, { params }) {
  await dbConnect();
  const { slug } = await params;
  const post = await Post.findOne({ slug, isPublished: true }).populate('author', 'name email');
  if (!post) return new Response('Not found', { status: 404 });
  return new Response(JSON.stringify(post), { status: 200 });
}

export async function PUT(req, { params }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return new Response('Unauthorized', { status: 401 });

  const { slug } = await params;
  const body = await req.json();

  await dbConnect();
  const post = await Post.findOne({ slug });
  if (!post) return new Response('Not found', { status: 404 });

  // only author or admin
  if (post.author?.toString() !== token.id && token.role !== 'admin') return new Response('Forbidden', { status: 403 });

  Object.assign(post, body);
  if (body.isPublished && !post.publishedAt) post.publishedAt = new Date();
  await post.save();

  return new Response(JSON.stringify(post), { status: 200 });
}

export async function DELETE(req, { params }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return new Response('Unauthorized', { status: 401 });

  const { slug } = await params;
  await dbConnect();
  const post = await Post.findOne({ slug });
  if (!post) return new Response('Not found', { status: 404 });

  if (post.author?.toString() !== token.id && token.role !== 'admin') return new Response('Forbidden', { status: 403 });

  // use deleteOne on the document to remove it (avoid deprecated/remove not a function issues)
  if (typeof post.deleteOne === 'function') {
    await post.deleteOne();
  } else {
    await Post.deleteOne({ _id: post._id });
  }
  return new Response(null, { status: 204 });
}