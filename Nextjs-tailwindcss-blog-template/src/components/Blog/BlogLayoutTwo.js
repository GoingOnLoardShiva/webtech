import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import React from "react";

const BlogLayoutTwo = ({ blog }) => {
  const imageSrc = blog?.image && (blog.image.src || (typeof blog.image === 'string' ? blog.image : null));
  const blurData = blog?.image?.blurDataURL || '';
  const width = blog?.image?.width || 600;
  const height = blog?.image?.height || 400;
  const firstTag = (blog?.tags && blog.tags.length > 0) ? blog.tags[0] : 'uncategorized';

  return (
    <div className="group grid grid-cols-12 gap-4 items-center text-dark dark:text-light">
      <Link
        href={blog?.url || `/blogs/${blog?.slug || ''}`}
        className=" col-span-12  lg:col-span-4 h-full rounded-xl overflow-hidden"
      >
        <Image
          src={imageSrc || '/default-banner.jpg'}
          placeholder={blurData ? 'blur' : undefined}
          blurDataURL={blurData}
          alt={blog?.title || 'Post image'}
          width={width}
          height={height}
          className="aspect-square w-full h-full object-cover object-center group-hover:scale-105 transition-all ease duration-300"
          sizes="(max-width: 640px) 100vw,(max-width: 1024px) 50vw, 33vw"
        />
      </Link>

      <div className="col-span-12  lg:col-span-8 w-full">
        <span className="inline-block w-full uppercase text-accent dark:text-accentDark font-semibold text-xs sm:text-sm">
          {firstTag}
        </span>
        <Link href={blog?.url || `/blogs/${blog?.slug || ''}`} className="inline-block my-1">
          <h2 className="font-semibold capitalize text-base sm:text-lg">
            <span
              className="bg-gradient-to-r from-accent/50 dark:from-accentDark/50 to-accent/50 dark:to-accentDark/50 bg-[length:0px_6px]
                group-hover:bg-[length:100%_6px] bg-left-bottom bg-no-repeat transition-[background-size] duration-500 "
            >
              {blog?.title}
            </span>
          </h2>
        </Link>

        <span className="inline-block w-full capitalize text-gray dark:text-light/50 font-semibold  text-xs sm:text-base">
          {(() => {
            const d = blog?.publishedAt || blog?.createdAt || null;
            if (!d) return '';
            try {
              return format(new Date(d), 'MMMM dd, yyyy');
            } catch (e) {
              return '';
            }
          })()}
        </span>
      </div>
    </div>
  );
};

export default BlogLayoutTwo;
