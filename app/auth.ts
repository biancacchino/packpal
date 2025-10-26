import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcrypt-ts';
import { getUser } from './db';
import { authConfig } from 'app/auth.config';

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...(authConfig as any),
  providers: [
    Credentials({
      async authorize({ email, password }: any) {
          try {
            const maybeUser: any = await getUser(email);
            // Drizzle version returns an array; Prisma returns a single object.
            const user = Array.isArray(maybeUser) ? maybeUser[0] : maybeUser;
            if (!user) return null;
            const passwordsMatch = await compare(password, user.password!);
            if (passwordsMatch) return user as any;
            return null;
          } catch (err) {
            // Log full error to server console for debugging in dev
            console.error('authorize() error while fetching user or comparing password:', err);
            return null;
          }
      },
    }),
  ],
});
