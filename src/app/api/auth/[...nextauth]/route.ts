import NextAuth, { type NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || 'placeholder',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'placeholder',
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || 'placeholder',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || 'placeholder',
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET || 'kariako-guide-dev-secret-key-2024',
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) {
        // Allow sign-in even without email - we'll handle it in jwt callback
        return true;
      }

      try {
        // Find or create user by email
        let existingUser = await db.user.findFirst({
          where: { email: user.email },
        });

        if (!existingUser) {
          // Create a new user with a placeholder phone for social login
          const phone = `social_${account?.provider}_${Date.now()}`;
          existingUser = await db.user.create({
            data: {
              email: user.email,
              phone,
              name: user.name || user.email.split('@')[0],
              avatarUrl: user.image || null,
              role: 'seeker',
            },
          });
        }

        // Set the auth_token cookie for compatibility with existing system
        const token = `token_${existingUser.id}_${Date.now()}`;
        try {
          const cookieStore = await cookies();
          cookieStore.set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
          });
        } catch {
          // Cookie setting can fail in some contexts, that's OK
        }

        // Attach the DB user info to the user object for JWT callback
        (user as Record<string, unknown>).dbId = existingUser.id;
        (user as Record<string, unknown>).dbRole = existingUser.role;

        return true;
      } catch (error) {
        console.error('Social login error:', error);
        return true; // Still allow sign-in, JWT will handle what it can
      }
    },
    async jwt({ token, user, account }) {
      // On first sign-in, user object is available
      if (user?.email) {
        try {
          const dbUser = await db.user.findFirst({
            where: { email: user.email },
          });
          if (dbUser) {
            token.dbId = dbUser.id;
            token.dbRole = dbUser.role;
            token.dbName = dbUser.name;
            token.dbPhone = dbUser.phone;
            token.dbAvatarUrl = dbUser.avatarUrl;
            token.dbLanguagePref = dbUser.languagePref;
          }
        } catch {
          // DB lookup can fail, token will still have basic info
        }
      }

      // Also check if dbId was set during signIn callback
      if (user && (user as Record<string, unknown>).dbId) {
        token.dbId = (user as Record<string, unknown>).dbId as string;
        token.dbRole = (user as Record<string, unknown>).dbRole as string;
      }

      return token;
    },
    async session({ session, token }) {
      if (token.dbId) {
        session.user = {
          ...session.user,
          id: token.dbId as string,
          role: token.dbRole as string,
          phone: token.dbPhone as string,
          dbId: token.dbId as string,
        };
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
    error: '/',
  },
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
