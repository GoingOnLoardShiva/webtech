'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    const fetchPosts = async () => {
      setLoading(true);
      const res = await fetch('/api/posts');
      const data = await res.json();
      setPosts(data);
      setLoading(false);
    };
    fetchPosts();
  }, [session]);

  if (!session) return <div className="max-w-md mx-auto mt-24">Please <Link href="/admin/login" className="text-blue-600">sign in</Link> to continue.</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Posts</h1>
        <Link href="/admin/posts/new" className="bg-blue-600 text-white px-3 py-2 rounded">New Post</Link>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {posts.map((p) => (
              <li key={p._id} className="px-4 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{p.title}</div>
                    <div className="text-sm text-gray-600">{p.slug} • {p.isPublished ? 'Published' : 'Draft'}</div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/admin/posts/${p.slug}`} className="text-sm text-blue-600">Edit</Link>
                    <a href={`/blogs/${p.slug}`} className="text-sm text-gray-600" target="_blank">View</a>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
