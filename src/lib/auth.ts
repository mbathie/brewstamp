import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Nodemailer from "next-auth/providers/nodemailer";
import bcrypt from "bcrypt";
import { getImpersonationFor } from "./impersonation";
import { cookies } from "next/headers";
import { connectDB } from "./mongoose";
import {
  User,
  Shop,
  ShopMembership,
  Account,
  VerificationToken,
} from "@/models";
import { readSignupAttribution } from "./signup-attr";

// Cookie name kept inline (vs. importing from ./shop-context) to avoid a
// circular import — shop-context.ts depends on auth().
const CURRENT_SHOP_COOKIE = "bs_current_shop";

// Custom MongoDB adapter (only the methods NextAuth needs)
const MongoDBAdapter = {
  async createUser(user: any) {
    await connectDB();
    // If a user with this email already exists (registered via credentials),
    // just update emailVerified and return them
    const existing = await User.findOne({ email: user.email });
    if (existing) {
      existing.emailVerified = user.emailVerified;
      await existing.save();
      return {
        id: existing._id.toString(),
        name: existing.name,
        email: existing.email,
        emailVerified: existing.emailVerified,
      };
    }
    // New user via OAuth/magic link — create without hash
    const attr = await readSignupAttribution();
    const newUser = await User.create({
      name: user.name || user.email?.split("@")[0] || "User",
      email: user.email,
      emailVerified: user.emailVerified,
      ...attr,
    });
    return {
      id: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
      emailVerified: newUser.emailVerified,
    };
  },

  async getUser(id: string) {
    await connectDB();
    const user = await User.findById(id);
    if (!user) return null;
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
    };
  },

  async getUserByEmail(email: string) {
    await connectDB();
    const user = await User.findOne({ email });
    if (!user) return null;
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
    };
  },

  async getUserByAccount({ provider, providerAccountId }: any) {
    await connectDB();
    const account = await Account.findOne({ provider, providerAccountId });
    if (!account) return null;
    const user = await User.findById(account.userId);
    if (!user) return null;
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
    };
  },

  async updateUser({ id, ...data }: any) {
    await connectDB();
    const user = await User.findByIdAndUpdate(id, data, { new: true });
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
    };
  },

  async linkAccount(account: any) {
    await connectDB();
    await Account.create({
      userId: account.userId,
      type: account.type,
      provider: account.provider,
      providerAccountId: account.providerAccountId,
      refresh_token: account.refresh_token,
      access_token: account.access_token,
      expires_at: account.expires_at,
      token_type: account.token_type,
      scope: account.scope,
      id_token: account.id_token,
      session_state: account.session_state,
    });
    return account;
  },

  async createVerificationToken({ identifier, token, expires }: any) {
    await connectDB();
    const vt = await VerificationToken.create({ identifier, token, expires });
    return {
      identifier: vt.identifier,
      token: vt.token,
      expires: vt.expires,
    };
  },

  async useVerificationToken({ identifier, token }: any) {
    await connectDB();
    const vt = await VerificationToken.findOneAndDelete({ identifier, token });
    if (!vt) return null;
    return {
      identifier: vt.identifier,
      token: vt.token,
      expires: vt.expires,
    };
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  adapter: MongoDBAdapter,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Nodemailer({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
        secure: false,
      },
      from: process.env.EMAIL_FROM,
      async sendVerificationRequest({ identifier: email, url, provider }) {
        const { createTransport } = await import("nodemailer");
        const transport = createTransport(provider.server as any);
        await transport.sendMail({
          to: email,
          from: provider.from,
          subject: "Sign in to Brewstamp",
          text: `Sign in to Brewstamp\n\nClick this link to sign in:\n${url}\n\nIf you didn't request this email, you can safely ignore it.`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #b45309;">Sign in to Brewstamp</h1>
              <p>Click the button below to sign in to your account:</p>
              <a href="${url}" style="display: inline-block; background: #b45309; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">
                Sign In
              </a>
              <p style="color: #666; font-size: 14px;">Or copy this link: ${url}</p>
              <p style="color: #999; font-size: 12px;">If you didn't request this email, you can safely ignore it.</p>
            </div>
          `,
        });
      },
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await connectDB();
        const user = await User.findOne({ email: credentials?.email });
        if (!user || !user.hash) return null;
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
      // For OAuth/magic link users, load shopId from DB if not set
      if (!token.shopId && token.sub) {
        await connectDB();
        const dbUser = await User.findById(token.sub);
        if (dbUser?.shopId) {
          token.shopId = dbUser.shopId.toString();
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.shopId = token.shopId as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    verifyRequest: "/verify-request",
  },
  session: {
    strategy: "jwt",
  },
});

// Returns the active shop context for the signed-in user. `shop` is the
// cookie-selected shop when set and the user has membership on it; otherwise
// it falls back to a primary owned shop. In aggregate ("All shops") mode the
// fallback applies so single-shop-aware callers still get a usable doc —
// aggregate-aware pages should branch on getCurrentShopContext() instead.
export async function getMerchant() {
  const session = await auth();
  if (!session?.user) return null;
  await connectDB();
  // Admin "view as" resolves through the target user here too. getMerchant is
  // a second, independent resolution path from getCurrentShopContext — miss it
  // and the layout renders as the merchant while the page below still renders
  // as the admin.
  const impersonation = await getImpersonationFor(session.user.email);
  const user = await User.findById(impersonation?.userId ?? session.user.id);
  if (!user) return null;

  const cookieStore = await cookies();
  const cookieVal = cookieStore.get(CURRENT_SHOP_COOKIE)?.value;

  // Resolve the active shop, trying candidates in priority order: the
  // active-shop cookie, the user's legacy shopId pointer, then any membership
  // (owned shops first, then manager/staff). Crucially, only accept a
  // candidate whose Shop document still EXISTS — a shopId or membership that
  // points at a deleted shop must be skipped, otherwise this returns a null
  // shop and the dashboard redirect-loops to /setup (a staff member whose old
  // duplicate shop was deleted; see Stockyard/Dave, 2026-08). Previously this
  // only fell back to `role: "owner"`, which also stranded staff/manager-only
  // users with no resolvable shop.
  let shop: any = null;

  const candidates: any[] = [];
  if (cookieVal && cookieVal !== "all") candidates.push(cookieVal);
  if (user.shopId) candidates.push(user.shopId);
  for (const cand of candidates) {
    const isMember = await ShopMembership.exists({ user: user._id, shop: cand });
    if (!isMember) continue;
    const s = await Shop.findById(cand);
    if (s) {
      shop = s;
      break;
    }
  }

  if (!shop) {
    const memberships = await ShopMembership.find({ user: user._id }).lean();
    const ordered = [
      ...memberships.filter((m: any) => m.role === "owner"),
      ...memberships.filter((m: any) => m.role !== "owner"),
    ];
    for (const m of ordered) {
      const s = await Shop.findById(m.shop);
      if (s) {
        shop = s;
        break;
      }
    }
  }

  // The caller's role on the resolved shop. Billing/owner-only routes gate
  // on this — getMerchant now resolves shops the user is merely staff/manager
  // on (via the active-shop cookie), so "has a shop" no longer implies "owns
  // it". `null` when there's no shop or no membership row.
  let role: "owner" | "manager" | "staff" | null = null;
  if (shop) {
    const membership = await ShopMembership.findOne({
      user: user._id,
      shop: shop._id,
    }).select("role");
    role = (membership?.role as "owner" | "manager" | "staff") || null;
  }

  return { user, shop, role };
}
