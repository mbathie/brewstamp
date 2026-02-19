import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { connectDB } from "./mongoose";
import { User, Shop } from "@/models";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await connectDB();
        const user = await User.findOne({ email: credentials?.email });
        if (!user) return null;
        const valid = await bcrypt.compare(
          credentials?.password as string,
          user.hash
        );
        if (!valid) return null;
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          shopId: user.shopId?.toString(),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.shopId = (user as any).shopId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).shopId = token.shopId;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});

export async function getMerchant() {
  const session = await auth();
  if (!session?.user) return null;
  await connectDB();
  const user = await User.findById((session.user as any).id);
  if (!user) return null;
  const shop = await Shop.findById(user.shopId);
  return { user, shop };
}
