"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import {
  CURRENT_SHOP_COOKIE,
  getMembershipsForUser,
} from "./shop-context";

// Server action variant for use inside <form action={...}> tags on the
// picker page. Validates membership, writes the cookie, redirects to the
// dashboard. The route handler version is for fetch-based client switchers.
export async function selectShopAction(target: string) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = session.user.id as string;

  const memberships = await getMembershipsForUser(userId);

  if (target === "all") {
    if (memberships.length < 2) redirect("/dashboard");
  } else {
    const hasAccess = memberships.some((m) => m.shopId === target);
    if (!hasAccess) redirect("/select-shop");
  }

  const store = await cookies();
  store.set(CURRENT_SHOP_COOKIE, target, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  redirect("/dashboard");
}
