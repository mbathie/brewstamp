import { redirect } from "next/navigation";
import { Store } from "lucide-react";
import { auth } from "@/lib/auth";
import { getUserPlanLimits } from "@/lib/plan-limits";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NewShopForm from "./new-shop-form";

export default async function NewShopPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = (session.user as any).id as string;

  // Server-side plan-limit guard — if the user is already at their plan's
  // shop quota, bounce them to the billing page where they can upgrade
  // instead of letting them fill out a form we'd refuse on submit.
  const limits = await getUserPlanLimits(userId);
  if (limits.atShopLimit) {
    redirect("/dashboard/billing?limit=1");
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
          <Store className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add a new shop</h1>
          <p className="text-sm text-muted-foreground">
            {limits.plan.label} plan: {limits.ownedShopCount} of{" "}
            {limits.shopLimit} shops used.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">New shop details</CardTitle>
        </CardHeader>
        <CardContent>
          <NewShopForm />
        </CardContent>
      </Card>
    </div>
  );
}
