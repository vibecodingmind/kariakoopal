import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      /** The user's name */
      name?: string | null;
      /** The user's email */
      email?: string | null;
      /** The user's image */
      image?: string | null;
      /** The user's database ID */
      id?: string;
      /** The user's database ID from our custom JWT */
      dbId?: string;
      /** The user's role: seeker, guide, or admin */
      role?: string;
      /** The user's phone number */
      phone?: string;
      /** The user's language preference */
      languagePref?: string;
      /** The user's avatar URL */
      avatarUrl?: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    dbId?: string;
    dbRole?: string;
    dbName?: string;
    dbPhone?: string;
    dbAvatarUrl?: string | null;
    dbLanguagePref?: string;
  }
}
