import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

interface GitHubProfile {
  id: number;
  login: string;
  avatar_url: string;
  name?: string;
  email?: string;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
      authorization: {
        params: {
          scope: "read:user user:email repo",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (!account || !profile) return false;

      const githubProfile = profile as unknown as GitHubProfile;

      // Upsert user in database
      const existingUser = await db.query.users.findFirst({
        where: eq(users.githubId, githubProfile.id),
      });

      if (existingUser) {
        await db
          .update(users)
          .set({
            username: githubProfile.login,
            name: githubProfile.name || null,
            email: githubProfile.email || null,
            avatarUrl: githubProfile.avatar_url,
            githubAccessToken: account.access_token,
            lastLoginAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(users.githubId, githubProfile.id));
      } else {
        await db.insert(users).values({
          githubId: githubProfile.id,
          username: githubProfile.login,
          name: githubProfile.name || null,
          email: githubProfile.email || null,
          avatarUrl: githubProfile.avatar_url,
          githubAccessToken: account.access_token,
          lastLoginAt: new Date(),
        });
      }

      return true;
    },
    async jwt({ token, account, profile }) {
      if (account && profile) {
        const githubProfile = profile as unknown as GitHubProfile;
        token.githubId = githubProfile.id;
        token.username = githubProfile.login;
      }
      return token;
    },
    async session({ session, token }) {
      // Store custom data in session
      if (token.githubId) {
        (session as unknown as { githubId: number }).githubId = token.githubId as number;
      }
      if (token.username) {
        (session as unknown as { username: string }).username = token.username as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
