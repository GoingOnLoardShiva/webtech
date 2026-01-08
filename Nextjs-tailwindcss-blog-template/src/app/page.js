export const dynamic = 'force-dynamic';

import HomeCoverSection from "../components/Home/HomeCoverSection";
import FeaturedPosts from "../components/Home/FeaturedPosts";
import RecentPosts from "../components/Home/RecentPosts";
import dbConnect from '@/src/lib/mongoose';
import Post from '@/src/models/Post';
import readingTime from 'reading-time';


function mapPostToBlog(p) {
  const image = p.image
    ? (typeof p.image === 'string'
        ? { src: p.image, width: 1200, height: 630, blurDataURL: '' }
        : p.image)
    : { src: '/default-banner.jpg', width: 1200, height: 630, blurDataURL: '' };

  return {
    title: p.title,
    slug: p.slug,
    url: `/blogs/${p.slug}`,
    image,
    description: p.description || p.excerpt || '',
    tags: p.tags || ['uncategorized'],
    publishedAt: p.publishedAt
      ? new Date(p.publishedAt).toISOString()
      : new Date(p.createdAt).toISOString(),
    updatedAt: p.updatedAt
      ? new Date(p.updatedAt).toISOString()
      : (p.publishedAt
          ? new Date(p.publishedAt).toISOString()
          : new Date(p.createdAt).toISOString()),
    readingTime: readingTime(p.content || ''),
    body: p.content || '',
  };
}

export default async function Home() {
  await dbConnect();

  const posts = await Post
    .find({ isPublished: true })
    .sort({ publishedAt: -1 })
    .lean();

  const blogs = posts.map(mapPostToBlog);

  return (
    <main className="flex flex-col items-center justify-center">
      <HomeCoverSection blogs={blogs} />
      <FeaturedPosts blogs={blogs} />
      <RecentPosts blogs={blogs} />

    </main>
  );
}
