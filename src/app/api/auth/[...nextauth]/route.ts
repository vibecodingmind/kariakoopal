import NextAuth, { type NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

// Check if a provider has real credentials configured
function hasRealCredentials(clientId?: string, clientSecret?: string): boolean {
  return !!(clientId && clientSecret && clientId !== 'placeholder' && clientSecret !== 'placeholder');
}

export const authOptions: NextAuthOptions = {
  providers: [
    // Only include Google provider if real credentials are configured
    ...(hasRealCredentials(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET)
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
    // Only include Facebook provider if real credentials are configured
    ...(hasRealCredentials(process.env.FACEBOOK_CLIENT_ID, process.env.FACEBOOK_CLIENT_SECRET)
      ? [
          FacebookProvider({
            clientId: process.env.FACEBOOK_CLIENT_ID!,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
          }),
        ]
      : []),
  ],
  secret: process.env.NEXTAUTH_SECRET || 'chimbo-direct-dev-secret-key-2024',
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
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
          // Create a new user with a unique placeholder phone for social login
          const phone = `social_${account?.provider}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          existingUser = await db.user.create({
            data: {
              email: user.email,
              phone,
              name: user.name || user.email.split('@')[0],
              avatarUrl: user.image || null,
              role: 'seeker', // Default role; user can change later
              languagePref: 'sw', // Default to Swahili for Kariakoo
            },
          });

          // If this is a guide social login, create a guide profile
          // (role is seeker by default, they can upgrade later)
        }

        // Update avatar URL if it changed (e.g., new profile pic from social provider)
        if (user.image && existingUser.avatarUrl !== user.image) {
          await db.user.update({
            where: { id: existingUser.id },
            data: { avatarUrl: user.image },
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
        (user as Record<string, unknown>).dbPhone = existingUser.phone;
        (user as Record<string, unknown>).dbLanguagePref = existingUser.languagePref;
        (user as Record<string, unknown>).dbAvatarUrl = existingUser.avatarUrl || user.image;

        return true;
      } catch (error) {
        console.error('Social login error:', error);
        // Still allow sign-in, JWT callback will handle what it can
        return true;
      }
    },
    async jwt({ token, user, account, trigger }) {
      // On first sign-in, user object is available with our custom fields
      if (user) {
        // Check if dbId was set during signIn callback
        const dbId = (user as Record<string, unknown>).dbId;
        if (dbId) {
          token.dbId = dbId as string;
          token.dbRole = (user as Record<string, unknown>).dbRole as string;
          token.dbPhone = (user as Record<string, unknown>).dbPhone as string;
          token.dbLanguagePref = (user as Record<string, unknown>).dbLanguagePref as string;
          token.dbAvatarUrl = (user as Record<string, unknown>).dbAvatarUrl as string;
        } else if (user.email) {
          // Fallback: look up user by email
          try {
            const dbUser = await db.user.findFirst({
              where: { email: user.email },
            });
            if (dbUser) {
              token.dbId = dbUser.id;
              token.dbRole = dbUser.role;
              token.dbPhone = dbUser.phone;
              token.dbName = dbUser.name;
              token.dbAvatarUrl = dbUser.avatarUrl;
              token.dbLanguagePref = dbUser.languagePref;
            }
          } catch {
            // DB lookup can fail, token will still have basic info
          }
        }
      }

      // On session update (e.g., after role change), refresh DB data
      if (trigger === 'update' && token.dbId) {
        try {
          const dbUser = await db.user.findUnique({
            where: { id: token.dbId as string },
          });
          if (dbUser) {
            token.dbRole = dbUser.role;
            token.dbPhone = dbUser.phone;
            token.dbName = dbUser.name;
            token.dbAvatarUrl = dbUser.avatarUrl;
            token.dbLanguagePref = dbUser.languagePref;
          }
        } catch {
          // DB lookup can fail, keep existing token data
        }
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
          languagePref: token.dbLanguagePref as string,
          avatarUrl: token.dbAvatarUrl as string | null,
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
