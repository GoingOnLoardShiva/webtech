import BlogLayoutThree from "@/src/components/Blog/BlogLayoutThree";
import Categories from "@/src/components/Blog/Categories";
import { slug } from "github-slugger";
import dbConnect from '@/src/lib/mongoose';
import Post from '@/src/models/Post';
import readingTime from 'reading-time';

function mapPostToBlog(p) {
  return {
    title: p.title,
    slug: p.slug,
    url: `/blogs/${p.slug}`,
    image: p.image ? (typeof p.image === 'string' ? { src: p.image, width: 1200, height: 630, blurDataURL: '' } : p.image) : { src: '/default-banner.jpg', width: 1200, height: 630, blurDataURL: '' },
    description: p.description || p.excerpt || '',
    tags: p.tags || ['uncategorized'],
    publishedAt: p.publishedAt ? new Date(p.publishedAt).toISOString() : new Date(p.createdAt).toISOString(),
    readingTime: readingTime(p.content || ''),
    body: p.content || '',
  };
}

export async function generateStaticParams() {
  await dbConnect();
  const posts = await Post.find({ isPublished: true }).select('tags').lean();
  const categories = new Set(['all']);
  posts.forEach((p) => {
    (p.tags || []).forEach((t) => categories.add(slug(t)));
  });
  return Array.from(categories).map((c) => ({ slug: c }));
}

export async function generateMetadata({ params }) {
  return {
    title: `${params.slug.replaceAll("-"," ")} Blogs`,
    description: `Learn more about ${params.slug === "all" ? "web development" : params.slug} through our collection of expert blogs and tutorials`,
  };
}

const CategoryPage = async ({ params }) => {
  await dbConnect();
  const allPosts = await Post.find({ isPublished: true }).lean();
  const allCategories = ['all'];
  allPosts.forEach((p) => (p.tags || []).forEach((t) => { const s = slug(t); if (!allCategories.includes(s)) allCategories.push(s); }));
  allCategories.sort();

  const blogs = allPosts
    .filter((p) => params.slug === 'all' ? true : (p.tags || []).some((t) => slug(t) === params.slug))
    .map(mapPostToBlog);

  return (
    <article className="mt-12 flex flex-col text-dark dark:text-light">
      <div className=" px-5 sm:px-10  md:px-24  sxl:px-32 flex flex-col">
        <h1 className="mt-6 font-semibold text-2xl md:text-4xl lg:text-5xl">#{params.slug}</h1>
        <span className="mt-2 inline-block">
          Discover more categories and expand your knowledge!
        </span>
      </div>
      <Categories categories={allCategories} currentSlug={params.slug} />

      <div className="grid  grid-cols-1 sm:grid-cols-2  lg:grid-cols-3 grid-rows-2 gap-16 mt-5 sm:mt-10 md:mt-24 sxl:mt-32 px-5 sm:px-10 md:px-24 sxl:px-32">
        {blogs.map((blog, index) => (
          <article key={index} className="col-span-1 row-span-1 relative">
            <BlogLayoutThree blog={blog} />
          </article>
        ))}
      </div>
    </article>
  );
};

export default CategoryPage;
