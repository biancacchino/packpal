import { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  // Required in middleware and route handlers for Auth.js v5
  // prefer NEXTAUTH_SECRET standard, fall back to AUTH_SECRET
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  providers: [
    // added later in auth.ts since it requires bcrypt which is only compatible with Node.js
    // while this file is also used in non-Node.js environments
  ],
  callbacks: {
    authorized(params) {
      // Keep this simple & side-effect free for middleware
      const { request, auth } = params as any;
      const isLoggedIn = !!auth?.user;
      const path = request?.nextUrl?.pathname as string;
      const isProtected = path?.startsWith('/dashboard') || path?.startsWith('/trips') || path?.startsWith('/protected');
      const isSharePath = path?.startsWith('/trips/share/');
      if (isProtected && !isSharePath) return isLoggedIn;
      return true;
    },
  },
} satisfies NextAuthConfig;
