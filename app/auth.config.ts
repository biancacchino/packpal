import { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  // Required in middleware and route handlers for Auth.js v5
  // prefer NEXTAUTH_SECRET (standard) but fall back to AUTH_SECRET if present
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  providers: [
    // added later in auth.ts since it requires bcrypt which is only compatible with Node.js
    // while this file is also used in non-Node.js environments
  ],
  callbacks: {
    authorized(params) {
      // Keep this simple and return a boolean to satisfy types.
      // params: { request: NextRequest; auth: Session | null }
      const { request, auth } = params as any;
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = request.nextUrl?.pathname?.startsWith('/protected');

      if (isOnDashboard) {
        return isLoggedIn;
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
