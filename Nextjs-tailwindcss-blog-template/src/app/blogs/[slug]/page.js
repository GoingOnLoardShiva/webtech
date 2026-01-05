import BlogDetails from "@/src/components/Blog/BlogDetails";
import RenderMdx from "@/src/components/Blog/RenderMdx";
import TOCClient from "@/src/components/Blog/TOCClient";
import Tag from "@/src/components/Elements/Tag";
import siteMetadata from "@/src/utils/siteMetaData";
import { slug as slugify } from "github-slugger";
import Image from "next/image";
import { notFound } from "next/navigation";
import dbConnect from '@/src/lib/mongoose';
import Post from '@/src/models/Post';
import readingTime from 'reading-time';
import { generateTOC } from '@/src/utils/markdown';
import AdBanner from "@/src/components/AdBanner";

export async function generateStaticParams() {
  await dbConnect();
  const posts = await Post.find({ isPublished: true }).select('slug').lean();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  await dbConnect();
  const post = await Post.findOne({ slug, isPublished: true }).lean();
  if (!post) return;

  const publishedAt = new Date(post.publishedAt).toISOString();
  const modifiedAt = new Date(post.updatedAt || post.publishedAt).toISOString();

  let imageList = [siteMetadata.socialBanner];
  if (post.image) {
    const img = typeof post.image === 'string' ? post.image : post.image.src || siteMetadata.socialBanner;
    imageList = [img.startsWith('http') ? img : siteMetadata.siteUrl + img];
  }

  const ogImages = imageList.map((img) => ({ url: img }));
  const authors = post.author || siteMetadata.author;

  return {
    title: post.title,
    description: post.description || post.excerpt || '',
    openGraph: {
      title: post.title,
      description: post.description || post.excerpt || '',
      url: siteMetadata.siteUrl + `/blogs/${post.slug}`,
      siteName: siteMetadata.title,
      locale: "en_US",
      type: "article",
      publishedTime: publishedAt,
      modifiedTime: modifiedAt,
      images: ogImages,
      authors: [authors],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description || post.excerpt || '',
      images: ogImages,
    },
  };
}

function TableOfContentsItem({ item, level = "two" }){
  return (
    <li className="py-1">
      <a
        href={item.url}
        data-level={level}
        className="data-[level=two]:pl-0 data-[level=two]:pt-2
                  data-[level=two]:border-t border-solid border-dark/40
                  data-[level=three]:pl-4
                  sm:data-[level=three]:pl-6
                  flex items-center justify-start"
      >
        {level === "three" && (
          <span className="flex w-1 h-1 rounded-full bg-dark mr-2">&nbsp;</span>
        )}
        <span className="hover:underline">{item.title}</span>
      </a>
      {item.items && item.items.length > 0 && (
        <ul className="mt-1">
          {item.items.map((subItem) => (
            <TableOfContentsItem 
              key={subItem.url} 
              item={subItem} 
              level="three"
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default async function BlogPage({ params }) {
  const { slug } = await params;
  await dbConnect();
  const post = await Post.findOne({ slug, isPublished: true }).lean();
  if (!post) return notFound();

  const blog = {
    title: post.title,
    description: post.description || post.excerpt || '',
    publishedAt: post.publishedAt ? new Date(post.publishedAt).toISOString() : new Date(post.createdAt).toISOString(),
    updatedAt: post.updatedAt ? new Date(post.updatedAt).toISOString() : post.publishedAt ? new Date(post.publishedAt).toISOString() : new Date(post.createdAt).toISOString(),
    tags: post.tags || ['uncategorized'],
    body: post.content || '',
    // toc & counts will be populated below from the raw markdown body
    toc: [],
    tocCounts: { total: 0 },
    readingTime: readingTime(post.content || ''),
    image: post.image ? (typeof post.image === 'string' ? { src: post.image, width: 1200, height: 630, blurDataURL: '' } : post.image) : { src: siteMetadata.socialBanner, width: 1200, height: 630, blurDataURL: '' },
  };

  const imageList = [blog.image.src.startsWith('http') ? blog.image.src : siteMetadata.siteUrl + blog.image.src];

  // Generate TOC and heading counts from raw markdown body
  try {
    const { toc, counts } = generateTOC(blog.body || '');
    blog.toc = toc;
    blog.tocCounts = counts;
  } catch (e) {
    // fallback: leave toc empty
    console.error('TOC generation failed', e);
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": blog.title,
    "description": blog.description,
    "image": imageList,
    "datePublished": new Date(blog.publishedAt).toISOString(),
    "dateModified": new Date(blog.updatedAt || blog.publishedAt).toISOString(),
    "author": [{
        "@type": "Person",
        "name": siteMetadata.author,
        "url": siteMetadata.twitter,
      }]
  }

  return (
    <>
    <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
       <article>
      <div className="mb-8 text-center relative w-full h-[70vh] bg-dark">
        <div className="w-full z-10 flex flex-col items-center justify-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <Tag
            name={blog.tags[0]}
            link={`/categories/${slugify(blog.tags[0])}`}
            className="px-6 text-sm py-2"
          />
          <h1
            className="inline-block mt-6 font-semibold capitalize text-light text-2xl md:text-3xl lg:text-5xl !leading-normal relative w-5/6"
          >
            {blog.title}
          </h1>
        </div>
        <div className="absolute top-0 left-0 right-0 bottom-0 h-full bg-dark/60 dark:bg-dark/40" />
        <Image
          src={blog.image.src}
          placeholder={blog.image.blurDataURL ? 'blur' : undefined}
          blurDataURL={blog.image.blurDataURL}
          alt={blog.title}
          width={blog.image.width}
          height={blog.image.height}
          className="aspect-square w-full h-full object-cover object-center"
          priority
          sizes="100vw"
        />
      </div>
      <BlogDetails blog={blog} slug={slug} />

      <div className="grid grid-cols-12  gap-y-8 lg:gap-8 sxl:gap-16 mt-8 px-5 md:px-10">
        <div className="col-span-12  lg:col-span-4">
          <details
            className="border-[1px] border-solid border-dark dark:border-light text-dark dark:text-light rounded-lg p-4 sticky top-6 max-h-[80vh] overflow-hidden overflow-y-auto"
            open
          >
            <summary className="text-lg font-semibold capitalize cursor-pointer">
              Table Of Content
            </summary>
            <div className="mt-2">
              <TOCClient toc={blog.toc} counts={blog.tocCounts} />
            </div>
          </details>
        </div>
        <AdBanner/>
        <RenderMdx blog={blog} />
      </div>
      <AdBanner/>
    </article>
    </>
  );
}