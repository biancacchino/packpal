import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { compare } from 'bcrypt-ts';
import { getUser, createGoogleUser } from 'app/db';
import { authConfig } from 'app/auth.config';

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Credentials({
      async authorize({ email, password }: any) {
        let user = await getUser(email);
        if (user.length === 0) return null;
        let passwordsMatch = await compare(password, user[0].password!);
        if (!passwordsMatch) return null;
        
        // Check if email is verified
        if (!user[0].emailVerified) {
          // We can throw an error here which NextAuth will catch and display
          throw new Error('Email not verified. Please check your inbox.');
        }
        
        return user[0] as any;
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === 'google' && profile?.email) {
        await createGoogleUser(profile.email);
        return true;
      }
      return true;
    },
    ...authConfig.callbacks,
  }
});
