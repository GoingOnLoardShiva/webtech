'use client';
import Link from 'next/link';
import { signOut, useSession, SessionProvider } from 'next-auth/react';

function AdminInner({ children }) {
  const { data: session, status } = useSession();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-semibold">Admin</Link>
            <Link href="/admin/posts/new" className="text-sm text-gray-600">New Post</Link>
          </div>
          <div>
            {status === 'loading' ? (
              // while loading, don't show sign-in or user to avoid flash
              <span className="text-sm text-gray-500">Checking session…</span>
            ) : session ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-700">{session.user?.name || session.user?.email}</span>
                <button className="text-sm text-red-600" onClick={() => signOut({ callbackUrl: '/admin/login' })}>Sign out</button>
              </div>
            ) : (
              <Link href="/admin/login" className="text-sm text-blue-600">Sign in</Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}

export default function AdminLayout({ children }) {
  // Wrap AdminInner with SessionProvider so useSession() works inside
  return (
    <SessionProvider>
      <AdminInner>{children}</AdminInner>
    </SessionProvider>
  );
}
