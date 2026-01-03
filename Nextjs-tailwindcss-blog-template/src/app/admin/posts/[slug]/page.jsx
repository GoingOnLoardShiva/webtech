'use client';
import { useEffect, useState } from 'react';
import PostForm from '@/src/components/Admin/PostForm';
import { useParams } from 'next/navigation';

export default function EditPostPage() {
  const params = useParams();
  const { slug } = params;
  const [post, setPost] = useState(null);

  useEffect(() => {
    if (!slug) return;
    const fetchPost = async () => {
      const res = await fetch(`/api/posts/${slug}`);
      if (res.ok) setPost(await res.json());
    };
    fetchPost();
  }, [slug]);

  if (!post) return <div>Loading…</div>;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Edit Post</h1>
      <PostForm initial={post} isEdit />
    </div>
  );
}
