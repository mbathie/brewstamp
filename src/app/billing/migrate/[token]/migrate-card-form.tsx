"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { PayPalCardFields } from "@/components/paypal-card-fields";

// The card step of the Stripe → PayPal migration page. Uses the public
// token-gated routes; on success shows the saved card and next charge date.
export function MigrateCardForm({
  token,
  clientId,
  nextChargeLabel,
}: {
  token: string;
  clientId: string;
  nextChargeLabel: string | null;
}) {
  const [done, setDone] = useState<{ card?: { brand?: string; last4?: string } } | null>(null);

  if (done) {
    return (
      <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-5 text-sm">
        <div className="flex items-center gap-2 text-base font-semibold text-emerald-400">
          <CheckCircle2 className="size-5" /> Card saved — you&apos;re all set
        </div>
        <p className="mt-2 text-muted-foreground">
          {done.card?.brand ? `${done.card.brand.toLowerCase()} •••• ${done.card.last4}` : "Your card"} will be charged
          {nextChargeLabel ? ` on ${nextChargeLabel}` : " on your usual renewal date"}, at the same price as before.
          Nothing has been charged today. You can close this page.
        </p>
      </div>
    );
  }

  return (
    <PayPalCardFields
      mode="update"
      clientId={clientId}
      endpoints={{
        setupToken: `/api/billing/migrate/${token}/setup-token`,
        paymentToken: `/api/billing/migrate/${token}/payment-token`,
      }}
      submitLabel="Save card — nothing charged today"
      onSuccess={(r) => setDone(r ?? {})}
    />
  );
}
