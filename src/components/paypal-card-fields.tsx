"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

// PayPal Advanced Card Fields, rendered inline — the customer never leaves
// the page and never needs a PayPal account. Card data goes straight from
// PayPal's iframes to PayPal; we only ever see an order / token id.
//
// Two modes:
//   checkout — first charge for a plan. Server creates the order
//              (/api/billing/paypal/order), PayPal collects the card, we
//              capture it (/api/billing/paypal/capture) which vaults the card
//              and activates the subscription.
//   update   — replace the saved card with no charge, via a vault setup
//              token (/setup-token → /payment-token).

declare global {
  interface Window {
    paypal?: any;
  }
}

const SDK_ID = "paypal-js-sdk";

function loadSdk(clientId: string, currency: string): Promise<any> {
  if (window.paypal?.CardFields) return Promise.resolve(window.paypal);
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(SDK_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(window.paypal));
      existing.addEventListener("error", reject);
      return;
    }
    const s = document.createElement("script");
    s.id = SDK_ID;
    const params = new URLSearchParams({
      "client-id": clientId,
      components: "card-fields",
      currency,
      intent: "capture",
    });
    s.src = `https://www.paypal.com/sdk/js?${params.toString()}`;
    s.async = true;
    s.onload = () => resolve(window.paypal);
    s.onerror = () => reject(new Error("PayPal SDK failed to load"));
    document.head.appendChild(s);
  });
}

type Props = {
  clientId: string;
  currency?: string;
  submitLabel: string;
  onSuccess: (result: any) => void;
} & (
  | { mode: "checkout"; plan: string; interval: "month" | "year" }
  | {
      mode: "update";
      // Override the token endpoints — the public migration page uses
      // token-gated routes instead of the logged-in owner ones.
      endpoints?: { setupToken: string; paymentToken: string };
    }
);

export function PayPalCardFields(props: Props) {
  const { clientId, currency = "USD", submitLabel, onSuccess } = props;
  const [ready, setReady] = useState(false);
  const [eligible, setEligible] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fieldsRef = useRef<any>(null);
  const renderedRef = useRef<any[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  // Latest props for the SDK callbacks, which are bound once.
  const propsRef = useRef(props);
  propsRef.current = props;

  useEffect(() => {
    let cancelled = false;

    loadSdk(clientId, currency)
      .then((paypal) => {
        if (cancelled || !containerRef.current) return;
        if (!paypal?.CardFields) {
          setEligible(false);
          return;
        }

        // PayPal renders each field in its own iframe; the style allow-list
        // covers background/border/height, so the inputs are themed to match
        // our dark inputs (stone palette) and our wrapper adds the focus ring.
        const style = {
          input: {
            "font-size": "15px",
            "font-family": "system-ui, -apple-system, 'Segoe UI', sans-serif",
            color: "#f5f5f4",
            background: "#1b1b1b",
            border: "none",
            "box-shadow": "none",
            padding: "11px 12px",
          },
          ":focus": { color: "#fafaf9", border: "none", "box-shadow": "none", outline: "none" },
          "::placeholder": { color: "#57534e" },
          // The frame must not draw its own borders in any state — ours is
          // the only outline.
          ".invalid": { color: "#f87171", border: "none", "box-shadow": "none" },
          ".valid": { border: "none", "box-shadow": "none" },
        };

        const common = {
          style,
          onError: (err: any) => {
            console.error("[PayPal card fields]", err);
            setError(err?.message || "Card fields error");
            setSubmitting(false);
          },
        };

        const p = propsRef.current;
        const cardFields = paypal.CardFields(
          p.mode === "checkout"
            ? {
                ...common,
                createOrder: async () => {
                  const cur = propsRef.current;
                  if (cur.mode !== "checkout") throw new Error("mode changed");
                  const res = await fetch("/api/billing/paypal/order", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ plan: cur.plan, interval: cur.interval }),
                  });
                  const json = await res.json();
                  if (!res.ok) throw new Error(json.error || "Could not start checkout");
                  return json.orderId as string;
                },
                onApprove: async (data: any) => {
                  const cur = propsRef.current;
                  if (cur.mode !== "checkout") return;
                  const res = await fetch("/api/billing/paypal/capture", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orderId: data.orderID, plan: cur.plan, interval: cur.interval }),
                  });
                  const json = await res.json();
                  setSubmitting(false);
                  if (!res.ok) {
                    setError(json.error || "Payment failed");
                    return;
                  }
                  cur.onSuccess(json);
                },
              }
            : {
                ...common,
                createVaultSetupToken: async () => {
                  const cur = propsRef.current;
                  const url = cur.mode === "update" && cur.endpoints ? cur.endpoints.setupToken : "/api/billing/paypal/setup-token";
                  const res = await fetch(url, { method: "POST" });
                  const json = await res.json();
                  if (!res.ok) throw new Error(json.error || "Could not start card update");
                  return json.setupTokenId as string;
                },
                onApprove: async (data: any) => {
                  const setupTokenId = data?.vaultSetupToken ?? data?.vault_setup_token ?? data?.setupToken ?? data?.id;
                  const cur = propsRef.current;
                  const url = cur.mode === "update" && cur.endpoints ? cur.endpoints.paymentToken : "/api/billing/paypal/payment-token";
                  const res = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    // approveData is logged server-side if the id is missing —
                    // the SDK's payload shape for vault approvals varies by version.
                    body: JSON.stringify({ setupTokenId, approveData: data }),
                  });
                  const json = await res.json();
                  setSubmitting(false);
                  if (!res.ok) {
                    setError(json.error || "Could not save card");
                    return;
                  }
                  propsRef.current.onSuccess(json);
                },
              }
        );

        if (!cardFields.isEligible()) {
          setEligible(false);
          return;
        }
        fieldsRef.current = cardFields;
        const rendered = [
          cardFields.NameField({ placeholder: "Jane Appleseed" }),
          cardFields.NumberField({ placeholder: "1234 1234 1234 1234" }),
          cardFields.ExpiryField({ placeholder: "MM / YY" }),
          cardFields.CVVField({ placeholder: "123" }),
        ];
        renderedRef.current = rendered;
        Promise.all(
          ["#pp-card-name", "#pp-card-number", "#pp-card-expiry", "#pp-card-cvv"].map((sel, i) => rendered[i].render(sel))
        ).then(() => {
          if (!cancelled) setReady(true);
        });
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Could not load card form");
      });

    return () => {
      cancelled = true;
      fieldsRef.current = null;
      // Tear the frames down so a re-opened form gets fresh ones — stale
      // instances otherwise keep focus/state bookkeeping alive.
      for (const f of renderedRef.current) {
        try { f.close?.(); } catch { /* already gone */ }
      }
      renderedRef.current = [];
    };
    // Re-mount only when the SDK identity changes; plan/interval flow via propsRef.
  }, [clientId, currency, props.mode]);

  async function submit() {
    if (!fieldsRef.current) return;
    setError(null);
    setSubmitting(true);
    try {
      // Resolves after onApprove/onError have run; rejects with PayPal's
      // own validation message if a field is invalid.
      await fieldsRef.current.submit();
    } catch (err: any) {
      const msg: string = err?.message || "";
      setError(/invalid|incomplete|valid/i.test(msg) ? "Please check the card details." : msg || "Payment failed");
      setSubmitting(false);
    }
  }

  if (!eligible) {
    return (
      <p className="text-sm text-red-400">
        Card payments aren&apos;t available for this account yet. Please contact
        hello@brewstamp.app.
      </p>
    );
  }

  // Each iframe fills a fixed-height box drawn like our Input: we own the
  // border + focus ring, the iframe paints a borderless dark input inside.
  const field =
    // PayPal sizes each iframe to its input plus ~9px of its own margin top
    // and bottom; a fixed 44px box with the frame nudged up centres the text.
    "h-11 overflow-hidden rounded-md border border-input bg-[#1b1b1b] shadow-xs transition-[border-color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 [&>div]:-mt-[9px] [&_iframe]:block";
  const label = "mb-1.5 block text-xs font-medium text-muted-foreground";

  return (
    <div ref={containerRef} className="space-y-4">
      <div>
        {!ready && !error && (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading secure card form…
          </div>
        )}
        <div className={ready ? "space-y-3.5" : "hidden"}>
          <div>
            <label htmlFor="pp-card-name" className={label}>Name on card</label>
            <div id="pp-card-name" className={field} />
          </div>
          <div>
            <label htmlFor="pp-card-number" className={label}>Card number</label>
            <div id="pp-card-number" className={field} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="pp-card-expiry" className={label}>Expiry</label>
              <div id="pp-card-expiry" className={field} />
            </div>
            <div>
              <label htmlFor="pp-card-cvv" className={label}>CVV</label>
              <div id="pp-card-cvv" className={field} />
            </div>
          </div>
        </div>
      </div>
      {error && (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
      )}
      <Button
        className="h-11 w-full cursor-pointer bg-amber-700 text-base text-white hover:bg-amber-800"
        disabled={!ready || submitting}
        onClick={submit}
      >
        {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Lock className="mr-2 size-4" />}
        {submitLabel}
      </Button>
      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <Lock className="size-3" /> Encrypted and processed by PayPal — card details never touch our servers.
      </p>
    </div>
  );
}
