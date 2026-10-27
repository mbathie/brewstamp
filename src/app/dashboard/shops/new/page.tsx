import { redirect } from "next/navigation";
import { getCurrentShopContext } from "@/lib/shop-context";
import { getUserPlanLimits } from "@/lib/plan-limits";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import NewShopForm from "./new-shop-form";

export default async function NewShopPage() {
  // The context's user, not the session's: under admin "view as" that's the
  // merchant being viewed, so the limit shown is theirs.
  const ctx = await getCurrentShopContext();
  if (!ctx) redirect("/login");
  const userId = ctx.userId;

  // Server-side plan-limit guard — if the user is already at their plan's
  // shop quota, bounce them to the billing page where they can upgrade
  // instead of letting them fill out a form we'd refuse on submit.
  const limits = await getUserPlanLimits(userId);
  if (limits.atShopLimit) {
    redirect("/dashboard/billing?limit=1");
  }

  return (
    <div className="max-w-xl space-y-6">
      <PageHeader
        title="Add a new shop"
        description={`${limits.plan.label} plan: ${limits.ownedShopCount} of ${limits.shopLimit} shops used.`}
      />

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
