import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Coffee, LayoutGrid } from "lucide-react";
import { auth } from "@/lib/auth";
import { getMembershipsForUser } from "@/lib/shop-context";
import { selectShopAction } from "@/lib/shop-actions";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function SelectShopPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = (session.user as any).id as string;

  const memberships = await getMembershipsForUser(userId);
  if (memberships.length === 0) redirect("/setup");

  // A solo-shop user shouldn't see a picker — bounce through the auto handler.
  if (memberships.length === 1) redirect("/api/shop-context?auto=1");

  return (
    <div className="dark min-h-svh bg-background px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Which shop are you working with?
        </h1>
        <p className="mt-2 text-muted-foreground">
          Pick a shop to view its dashboard, or see the rollup across all of them.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <form action={selectShopAction.bind(null, "all")}>
            <button
              type="submit"
              className="group flex w-full cursor-pointer items-center gap-4 rounded-xl border border-border bg-card p-5 text-left transition hover:border-amber-500 hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                <LayoutGrid className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-foreground">All shops</div>
                <div className="text-sm text-muted-foreground">
                  Combined dashboard across {memberships.length} shops
                </div>
              </div>
            </button>
          </form>

          {memberships.map((m) => (
            <form key={m.shopId} action={selectShopAction.bind(null, m.shopId)}>
              <button
                type="submit"
                className="group flex w-full cursor-pointer items-center gap-4 rounded-xl border border-border bg-card p-5 text-left transition hover:border-amber-500 hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-foreground/80">
                  <Coffee className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-foreground">
                    {m.shopName}
                  </div>
                  <div className="text-sm capitalize text-muted-foreground">
                    {m.role}
                  </div>
                </div>
              </button>
            </form>
          ))}
        </div>
      </div>
    </div>
  );
}
