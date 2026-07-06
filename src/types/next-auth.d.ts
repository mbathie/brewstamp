import type { DefaultSession } from "next-auth";

// Augment the NextAuth session so `session.user.id` is typed — removes the
// `session.user.id` casts scattered across pages, routes, and lib.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      // Legacy single-shop pointer set in the session callback; optional because
      // multi-shop users are scoped via memberships instead.
      shopId?: string;
    } & DefaultSession["user"];
  }
}
