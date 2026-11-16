import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/admin/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
        token.restaurantId = (user as { restaurantId: string }).restaurantId;
        token.restaurantSlug = (user as { restaurantSlug: string }).restaurantSlug;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.restaurantId = token.restaurantId as string;
        session.user.restaurantSlug = token.restaurantSlug as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
