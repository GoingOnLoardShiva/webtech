import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Protect /admin routes with NextAuth token.
 * Exempt /admin/login so unauthenticated users can reach the login screen.
 */
export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // Only apply to /admin paths
  if (pathname.startsWith('/admin')) {
    // Allow login page and public assets
    if (pathname === '/admin/login' || pathname.startsWith('/admin/login')) {
      return NextResponse.next();
    }

    let token;
    try {
      token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    } catch (err) {
      // token decryption failed (invalid cookie), redirect to login to clear bad cookie
      console.warn('getToken error:', err?.message || err);
      const loginUrl = new URL('/admin/login', req.url);
      loginUrl.searchParams.set('callbackUrl', req.url);
      return NextResponse.redirect(loginUrl);
    }

    if (!token) {
      const loginUrl = new URL('/admin/login', req.url);
      loginUrl.searchParams.set('callbackUrl', req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};