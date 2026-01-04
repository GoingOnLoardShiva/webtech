import dbConnect from '@/src/lib/mongoose';
import Post from '@/src/models/Post';
import { getToken } from 'next-auth/jwt';

export async function GET(req, { params }) {
  await dbConnect();
  const { slug } = await params;
  // allow admins/authors (authenticated) to fetch unpublished posts for editing
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const post = token
    ? await Post.findOne({ slug }).populate('author', 'name email')
    : await Post.findOne({ slug, isPublished: true }).populate('author', 'name email');
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
  if (post.author?.toString() !== token.id && token.role !== 'admin')
    return new Response('Forbidden', { status: 403 });

  // if slug changed ensure uniqueness
  if (body.slug && body.slug !== slug) {
    const exists = await Post.findOne({ slug: body.slug });
    if (exists) return new Response('Slug already exists', { status: 409 });
  }

  // only update explicit fields to avoid accidentally overwriting things
  const updatable = [
    'title',
    'slug',
    'content',
    'excerpt',
    'description',
    'image',
    'featuredImage',
    'tags',
    'isPublished',
  ];
  for (const key of updatable) {
    if (key in body) post[key] = body[key];
  }

  if (body.isPublished && !post.publishedAt) post.publishedAt = new Date();
  if (!body.isPublished) post.publishedAt = null;

  await post.save();
  console.log('Post updated:', post);

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