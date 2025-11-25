import { auth } from 'app/auth';
import { NextResponse } from 'next/server';

// Use Auth.js v5 middleware to protect selected routes and handle auth-page redirects when logged in
export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth?.user;
  const isAuthPage = nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/register');

  // if (isLoggedIn && isAuthPage) {
  //   return NextResponse.redirect(new URL('/dashboard', nextUrl));
  // }
  return NextResponse.next();
});

export const config = {
  // Only run on relevant app pages to reduce overhead
  matcher: ['/login', '/register', '/dashboard', '/trips/:path*', '/protected'],
};
