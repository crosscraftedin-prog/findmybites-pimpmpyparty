import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";

/**
 * NextAuth configuration for vendor sign-in.
 *
 * Providers:
 *  1. Google OAuth — activated automatically when GOOGLE_CLIENT_ID and
 *     GOOGLE_CLIENT_SECRET are set in the environment. This is the production
 *     path vendors use to sign in.
 *  2. Credentials (demo) — always available. Lets a vendor sign in with just
 *     an email + name so the full listing/edit flow is testable without
 *     Google Cloud credentials. In production with Google configured, this
 *     still works as a fallback (you can remove it if you don't want it).
 *
 * Strategy: JWT (stateless — no database session table needed). The user's
 * email/name/image are stored in the JWT and exposed on the client session.
 *
 * On every sign-in we upsert the User row so the DB stays in sync (used for
 * the vendor→user ownership relation).
 */

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleConfigured = !!googleClientId && !!googleClientSecret;

export const authOptions: NextAuthOptions = {
  providers: [
    ...(googleConfigured
      ? [
          GoogleProvider({
            clientId: googleClientId!,
            clientSecret: googleClientSecret!,
          }),
        ]
      : []),
    CredentialsProvider({
      id: "demo",
      name: "Demo sign-in",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        name: { label: "Name", type: "text", placeholder: "Your name" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        if (!email || !/^\S+@\S+\.\S+$/.test(email)) return null;
        const name = credentials?.name?.trim() || email.split("@")[0];
        return {
          id: email,
          email,
          name,
          image: null,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      // first sign-in: persist the user info on the token
      if (user) {
        token.email = user.email ?? token.email;
        token.name = user.name ?? token.name;
        token.picture = user.image ?? token.picture;
      }
      return token;
    },
    async session({ session, token }) {
      // expose the token data on the client session
      if (session.user) {
        session.user.email = token.email ?? session.user.email;
        session.user.name = token.name ?? session.user.name;
        session.user.image = token.picture ?? session.user.image;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      // upsert the User row so the vendor→user relation works
      if (user.email) {
        try {
          await db.user.upsert({
            where: { email: user.email },
            create: {
              email: user.email,
              name: user.name ?? null,
              image: user.image ?? null,
              emailVerified: new Date(),
            },
            update: {
              name: user.name ?? undefined,
              image: user.image ?? undefined,
            },
          });
        } catch (err) {
          console.error("[auth] user upsert failed:", err);
        }
      }
    },
  },
  pages: {
    // we use a client-side dialog for sign-in, but keep a fallback API page
    signIn: "/",
  },
};

/** Whether real Google OAuth is configured (controls which button we show). */
export const isGoogleConfigured = googleConfigured;
