'use client';
import PostForm from '@/src/components/Admin/PostForm';

export default function NewPostPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">New Post</h1>
      <PostForm />
    </div>
  );
}
