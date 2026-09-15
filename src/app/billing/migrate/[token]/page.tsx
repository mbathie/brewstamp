import type { Metadata } from "next";
import Link from "next/link";
import { Coffee, CreditCard } from "lucide-react";
import { connectDB } from "@/lib/mongoose";
import { Shop, Subscription } from "@/models";
import { resolveSub } from "@/lib/plans";
import { stripeAmount } from "@/lib/paypal-billing";
import { stampySubForToken } from "@/lib/stampy-billing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MigrateCardForm } from "./migrate-card-form";

export const metadata: Metadata = {
  title: "Update your payment card — Brewstamp",
  robots: { index: false, follow: false },
};

// Public landing for the Stripe → PayPal migration email. The token in the
// URL is the only credential: it identifies one subscription and is cleared
// once a card has been saved, so the link works exactly once.
export default async function MigratePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  await connectDB();
  const valid = /^[a-f0-9]{64}$/.test(token);
  const sub = valid ? await Subscription.findOne({ migrationToken: token }).lean<any>() : null;
  const stampy = !sub && valid ? await stampySubForToken(token) : null;
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  // Legacy StampyStamp merchant — same flow, their brand, their price. A
  // merchant already on PayPal reaching this page is replacing a card.
  if (stampy) {
    const sym = stampy.currency === "aud" ? "A$" : "US$";
    const next = stampy.currentPeriodEnd ? new Date(stampy.currentPeriodEnd) : null;
    const nextLabel = next ? next.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }) : null;
    const replacing = stampy.provider === "paypal";
    return (
      <Shell title="Update your payment card" brand="stampystamp">
        <p className="text-sm text-gray-600">
          {replacing && stampy.status === "past_due"
            ? "Your last renewal didn't go through. Enter a new card below — we'll retry on the date shown and nothing extra is charged today."
            : replacing
              ? "Enter a new card below to replace the one we have on file. Nothing is charged today — it's used from your next renewal."
              : "StampyStamp's billing is now run by Brewstamp, and card payments are moving from Stripe to PayPal to reduce processing fees. Your plan, price and billing date stay exactly the same — we just need your card once more. Nothing is charged today."}
        </p>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm">
          <div className="flex items-baseline justify-between">
            <span className="font-medium text-gray-900">{stampy.merchantName}</span>
            <span className="text-lg font-semibold text-gray-900">
              {sym}{(stampy.priceCents / 100).toFixed(2)}
              <span className="text-xs font-normal text-gray-500"> / {stampy.interval === "year" ? "year" : "month"}</span>
            </span>
          </div>
          <div className="mt-3 space-y-1 border-t border-gray-200 pt-3 text-xs text-gray-500">
            <div className="flex justify-between"><span>Plan</span><span className="text-gray-900">StampyStamp {stampy.planLabel}</span></div>
            <div className="flex justify-between"><span>Charged today</span><span className="text-gray-900">{sym}0.00</span></div>
            <div className="flex justify-between"><span>{replacing && stampy.status === "past_due" ? "Next retry" : "Next charge"}</span><span className="text-gray-900">{(replacing && stampy.nextAttemptAt ? new Date(stampy.nextAttemptAt).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }) : nextLabel) ?? "your usual renewal date"}</span></div>
          </div>
        </div>
        {clientId ? (
          <MigrateCardForm token={token} clientId={clientId} nextChargeLabel={nextLabel} theme="stampy" />
        ) : (
          <p className="text-sm text-red-600">Card form is not configured. Please contact hello@brewstamp.app.</p>
        )}
      </Shell>
    );
  }

  if (!sub) {
    return (
      <Shell title="Link not valid">
        <p className="text-sm text-muted-foreground">
          This link is invalid or has already been used. If you&apos;ve already saved
          your card, there&apos;s nothing more to do. Otherwise reply to the email
          you received and we&apos;ll send a fresh link.
        </p>
      </Shell>
    );
  }

  const shop = await Shop.findById(sub.shop).select("name").lean<any>();
  const tier = resolveSub(sub);
  const { amountCents, currency, interval } = stripeAmount(sub);
  const sym = currency === "aud" ? "A$" : "US$";
  const next = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null;
  const nextLabel = next ? next.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }) : null;

  return (
    <Shell title="Update your payment card">
      <p className="text-sm text-muted-foreground">
        We&apos;re moving Brewstamp&apos;s card payments to PayPal to reduce processing
        fees. Your plan, price and billing date stay exactly the same — we just
        need your card once more. Nothing is charged today.
      </p>

      <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
        <div className="flex items-baseline justify-between">
          <span className="font-medium text-foreground">{shop?.name ?? "Your shop"}</span>
          <span className="text-lg font-semibold text-foreground">
            {sym}{(amountCents / 100).toFixed(2)}
            <span className="text-xs font-normal text-muted-foreground"> / {interval === "year" ? "year" : "month"}</span>
          </span>
        </div>
        <div className="mt-3 space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
          <div className="flex justify-between"><span>Plan</span><span className="text-foreground">{tier.label}{tier.legacy ? " (your original price)" : ""}</span></div>
          <div className="flex justify-between"><span>Charged today</span><span className="text-foreground">{sym}0.00</span></div>
          <div className="flex justify-between"><span>Next charge</span><span className="text-foreground">{nextLabel ?? "your usual renewal date"}</span></div>
        </div>
      </div>

      {clientId ? (
        <MigrateCardForm token={token} clientId={clientId} nextChargeLabel={nextLabel} />
      ) : (
        <p className="text-sm text-red-400">Card form is not configured. Please contact hello@brewstamp.app.</p>
      )}
    </Shell>
  );
}

function Shell({ title, children, brand = "brewstamp" }: { title: string; children: React.ReactNode; brand?: "brewstamp" | "stampystamp" }) {
  // StampyStamp keeps its own look: mint page, white card, periwinkle accents,
  // DM Sans. Brewstamp pages stay on the dark dashboard theme.
  if (brand === "stampystamp") {
    return (
      <div className="min-h-svh bg-[#cef0df] px-6 py-16 text-gray-900" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <div className="mx-auto flex max-w-md flex-col items-center">
          <a href="https://stampystamp.com.au" className="mb-6 flex flex-col items-center gap-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://stampystamp.com.au/logoL_stampyStamp.png" alt="StampyStamp" className="h-14 w-auto" />
            <span className="text-xs text-gray-600">billing by Brewstamp</span>
          </a>
          <div className="w-full rounded-2xl bg-white p-6 shadow-sm">
            <h1 className="mb-5 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <CreditCard className="size-5 text-[#7c92e7]" />
              {title}
            </h1>
            <div className="space-y-5">{children}</div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="dark min-h-svh bg-background px-6 py-16">
      <div className="mx-auto flex max-w-md flex-col items-center">
        <Link href="/" className="mb-6 flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-700">
            <Coffee className="h-5 w-5 text-white" />
          </div>
          <span className="font-[family-name:var(--font-logo)] text-3xl tracking-wide text-foreground">Brewstamp</span>
        </Link>
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="size-5 text-amber-500" />
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}
