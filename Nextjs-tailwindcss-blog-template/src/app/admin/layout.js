'use client';

import Link from 'next/link';
import { signOut, useSession, SessionProvider } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

function AdminInner({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(
        `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`
      );
    }
  }, [status, router]);

  // Prevent UI flash
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Checking admin session…
      </div>
    );
  }

  // Extra safety (middleware already blocks this)
  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto py-4 px-4 flex justify-between">
          <div className="flex gap-6">
            <Link href="/admin" className="font-semibold">Admin</Link>
            <Link href="/admin/posts/new" className="text-sm text-gray-600">
              New Post
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700">
              {session.user?.email}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-sm text-red-600"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-8 px-4">
        {children}
      </main>
    </div>
  );
}

export default function AdminLayout({ children }) {
  return (
    <SessionProvider>
      <AdminInner>{children}</AdminInner>
    </SessionProvider>
  );
}
