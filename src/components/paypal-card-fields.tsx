"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

// PayPal requires the SDK's currency and intent to match the order the card
// fields attach to. A card check is an AUTHORIZE order in the subscriber's
// currency (often AUD); a checkout is a CAPTURE in USD. Until 2026-10-05 every
// form loaded the SDK as USD + capture, so AUD card checks ran mismatched. Each
// combination now gets its own script under its own global namespace, so a page
// can hold more than one without them clobbering each other.
function loadSdk(clientId: string, currency: string, intent: "capture" | "authorize"): Promise<any> {
  const ns = `paypal_${currency.toLowerCase()}_${intent}`;
  const id = `paypal-js-sdk-${currency.toLowerCase()}-${intent}`;
  const w = window as any;
  if (w[ns]?.CardFields) return Promise.resolve(w[ns]);
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(w[ns]));
      existing.addEventListener("error", reject);
      return;
    }
    const s = document.createElement("script");
    s.id = id;
    const params = new URLSearchParams({
      "client-id": clientId,
      components: "card-fields",
      currency: currency.toUpperCase(),
      intent,
    });
    s.src = `https://www.paypal.com/sdk/js?${params.toString()}`;
    s.setAttribute("data-namespace", ns);
    s.async = true;
    s.onload = () => resolve(w[ns]);
    s.onerror = () => reject(new Error("PayPal SDK failed to load"));
    document.head.appendChild(s);
  });
}

// ── Billing country + postcode ─────────────────────────────────────────────
// Sent to PayPal on submit as the card's billing address. Without it a
// first-time foreign card has fewer signals for PayPal's risk check, which
// refused several Australian cards outright (PAYER_CANNOT_PAY) in Oct 2026.

const COUNTRY_CODES =
  "AD AE AF AG AI AL AM AO AR AT AU AW AZ BA BB BD BE BF BG BH BI BJ BM BN BO BR BS BT BW BY BZ CA CD CF CG CH CI CK CL CM CN CO CR CV CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GH GI GL GM GN GP GR GT GW GY HK HN HR HU ID IE IL IN IS IT JM JO JP KE KG KH KI KM KN KR KW KY KZ LA LC LI LK LS LT LU LV MA MC MD ME MG MH MK ML MN MO MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PL PM PN PT PW PY QA RE RO RS RW SA SB SC SE SG SH SI SK SL SM SN SO SR ST SV SZ TC TD TG TH TJ TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VG VN VU WF WS YE YT ZA ZM ZW".split(" ");

// Countries without postcodes: the field is hidden for these.
const NO_POSTCODE = new Set(["AE", "AG", "AO", "AW", "BF", "BI", "BJ", "BS", "BW", "BZ", "CD", "CF", "CG", "CI", "CK", "CM", "DJ", "DM", "ER", "FJ", "GA", "GD", "GH", "GM", "GY", "HK", "JM", "KI", "KM", "KN", "LC", "ML", "MO", "MR", "MS", "MW", "NR", "NU", "QA", "RW", "SB", "SC", "SL", "SR", "ST", "SY", "TD", "TG", "TO", "TT", "TV", "UG", "VU", "YE", "ZW"]);

// Best guess at the payer's country from their browser, before they choose.
function guessCountry(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    const byZone: [RegExp, string][] = [
      [/^Australia\//, "AU"], [/^Pacific\/Auckland|^Pacific\/Chatham/, "NZ"], [/^Europe\/London/, "GB"],
      [/^Europe\/Dublin/, "IE"], [/^Asia\/Singapore/, "SG"], [/^Asia\/Hong_Kong/, "HK"], [/^Asia\/Tokyo/, "JP"],
      [/^Asia\/Riyadh/, "SA"], [/^Asia\/Dubai/, "AE"], [/^America\/Toronto|^America\/Vancouver|^America\/Edmonton|^America\/Winnipeg|^America\/Halifax/, "CA"],
    ];
    for (const [re, cc] of byZone) if (re.test(tz)) return cc;
    const region = (navigator.language || "").split("-")[1]?.toUpperCase();
    if (region && COUNTRY_CODES.includes(region)) return region;
    if (/^America\/|^US\/|^Pacific\/Honolulu/.test(tz)) return "US";
  } catch {
    /* fall through */
  }
  return "US";
}

// Report a step of the card form to the server log (7-day retention) so a
// failure that never reaches our API, like a refusal inside PayPal's iframes,
// still leaves a trace. Fire-and-forget; never throws. No card data: PayPal
// only exposes field validity and the detected brand.
function report(event: string, data: Record<string, unknown> = {}) {
  try {
    void fetch("/api/billing/paypal/client-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, page: window.location.pathname, ...data }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* logging must never break checkout */
  }
}

// Everything useful on an SDK or PayPal error, without the noise.
function errDetail(err: any) {
  if (!err) return null;
  if (typeof err !== "object") return String(err);
  return {
    name: err.name,
    message: err.message,
    debug_id: err.debug_id ?? err.debugId,
    details: err.details,
    stack: typeof err.stack === "string" ? err.stack.split("\n").slice(0, 3).join(" | ") : undefined,
  };
}

// Field validity from CardFields.getState(), reduced to booleans + brand.
async function fieldState(cardFields: any) {
  try {
    const st = await cardFields?.getState?.();
    if (!st) return null;
    const f: Record<string, string> = {};
    for (const [k, v] of Object.entries<any>(st.fields || {})) {
      f[k.replace(/Field$/, "")] = v?.isEmpty ? "empty" : v?.isValid ? "valid" : v?.isPotentiallyValid ? "partial" : "invalid";
    }
    return { formValid: !!st.isFormValid, brand: st.cards?.[0]?.type ?? null, ...f };
  } catch {
    return null;
  }
}

// PayPal's issue codes, as the SDK surfaces them in an error message, in words
// a shop owner can act on. PAYER_CANNOT_PAY is PayPal's risk check refusing the
// card outright, typically after the bank declined it once.
function friendlyPayPalError(msg: string): string | null {
  if (/PAYER_CANNOT_PAY/i.test(msg)) {
    return "This card can't be used for this payment. Please try a different card, or ask your bank to allow online payments in US dollars.";
  }
  if (/INSTRUMENT_DECLINED|CARD_DECLINED|DECLINED/i.test(msg)) {
    return "Your card was declined. Please try a different card, or ask your bank to allow online payments in US dollars.";
  }
  if (/CARD_EXPIRED/i.test(msg)) return "That card has expired. Please use a different card.";
  if (/CVV|SECURITY_CODE/i.test(msg)) return "The security code (CVV) doesn't look right. Please check it and try again.";
  if (/AUTHENTICATION|3DS|THREE_D/i.test(msg)) return "Your bank couldn't verify this card. Please try again, or use a different card.";
  // Anything else PayPal returns raw ("…/confirm-payment-source returned status
  // 422 (Corr ID …) {json}") is meaningless to an owner; the full text still
  // goes to the server log via report().
  if (/returned status \d{3}|UNPROCESSABLE_ENTITY|"debug_id"/i.test(msg)) {
    return "That card couldn't be used. Please check the details, or try a different card.";
  }
  return null;
}

type Props = {
  /** Billing country to preselect (ISO alpha-2). Defaults to a guess from the browser. */
  defaultCountry?: string;
  clientId: string;
  currency?: string;
  submitLabel: string;
  onSuccess: (result: any) => void;
  // "dark" matches the Brewstamp dashboard; "stampy" is the legacy
  // StampyStamp look (light, mint + periwinkle).
  theme?: "dark" | "stampy";
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
  const { clientId, currency = "USD", submitLabel, onSuccess, theme = "dark" } = props;
  const [ready, setReady] = useState(false);
  const [eligible, setEligible] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [country, setCountry] = useState<string>(() => (props.defaultCountry || "").toUpperCase() || "US");
  const [postcode, setPostcode] = useState("");
  // Pick the browser-based guess after mount (navigator isn't available on the server).
  useEffect(() => {
    if (!props.defaultCountry) setCountry(guessCountry());
  }, [props.defaultCountry]);
  const countryNames = useMemo(() => {
    let dn: Intl.DisplayNames | null = null;
    try {
      dn = new Intl.DisplayNames(["en"], { type: "region" });
    } catch {
      /* old browser: show codes */
    }
    return COUNTRY_CODES.map((c) => ({ code: c, name: dn?.of(c) ?? c })).sort((a, b) => a.name.localeCompare(b.name));
  }, []);
  const fieldsRef = useRef<any>(null);
  const renderedRef = useRef<any[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  // Latest props for the SDK callbacks, which are bound once.
  const propsRef = useRef(props);
  propsRef.current = props;
  // Order id of the attempt in flight, so every report can be tied to PayPal's record.
  const orderIdRef = useRef<string | null>(null);
  // Set once onApprove has succeeded. With 3-D Secure, PayPal's challenge
  // window can close after that and reject submit() ("Window closed for
  // postrobot_method"); that is not a failure and must not show an error.
  const doneRef = useRef(false);
  const ctx = () => {
    const p = propsRef.current;
    return {
      mode: p.mode,
      plan: p.mode === "checkout" ? p.plan : undefined,
      interval: p.mode === "checkout" ? p.interval : undefined,
      orderId: orderIdRef.current,
    };
  };

  useEffect(() => {
    let cancelled = false;

    loadSdk(clientId, currency, propsRef.current.mode === "checkout" ? "capture" : "authorize")
      .then((paypal) => {
        if (cancelled || !containerRef.current) return;
        if (!paypal?.CardFields) {
          report("not_eligible", { ...ctx(), message: "SDK loaded without CardFields" });
          setEligible(false);
          return;
        }

        // PayPal renders each field in its own iframe; the style allow-list
        // covers background/border/height, so the inputs are themed to match
        // our dark inputs (stone palette) and our wrapper adds the focus ring.
        const stampy = propsRef.current.theme === "stampy";
        const style = {
          input: {
            "font-size": "15px",
            "font-family": stampy ? "'DM Sans', system-ui, sans-serif" : "system-ui, -apple-system, 'Segoe UI', sans-serif",
            color: stampy ? "#1f2937" : "#f5f5f4",
            background: stampy ? "#ffffff" : "#1b1b1b",
            border: "none",
            "box-shadow": "none",
            padding: "11px 12px",
          },
          ":focus": { color: stampy ? "#111827" : "#fafaf9", border: "none", "box-shadow": "none", outline: "none" },
          "::placeholder": { color: stampy ? "#9ca3af" : "#57534e" },
          // The frame must not draw its own borders in any state — ours is
          // the only outline.
          ".invalid": { color: stampy ? "#dc2626" : "#f87171", border: "none", "box-shadow": "none" },
          ".valid": { border: "none", "box-shadow": "none" },
        };

        const common = {
          style,
          onError: (err: any) => {
            console.error("[PayPal card fields]", err);
            const shown = friendlyPayPalError(String(err?.message || "")) || err?.message || "Card fields error";
            report("card_fields_error", { ...ctx(), message: err?.message, detail: errDetail(err), shown });
            setError(shown);
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
                  const json = await res.json().catch(() => ({}));
                  if (!res.ok) {
                    report("create_order_failed", { ...ctx(), status: res.status, message: json.error, detail: json });
                    throw new Error(json.error || "Could not start checkout");
                  }
                  orderIdRef.current = json.orderId;
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
                  const json = await res.json().catch(() => ({}));
                  setSubmitting(false);
                  if (!res.ok) {
                    report("approve_failed", { ...ctx(), orderId: data.orderID, status: res.status, message: json.error, detail: json, shown: json.error || "Payment failed" });
                    setError(json.error || "Payment failed");
                    return;
                  }
                  doneRef.current = true;
                  report("success", { ...ctx(), orderId: data.orderID, detail: { liabilityShift: data.liabilityShift ?? null } });
                  cur.onSuccess(json);
                },
              }
            : {
                ...common,
                // "Save card" is an authorize-and-void order that vaults the
                // card (the live account has no standalone Vault API access).
                createOrder: async () => {
                  const cur = propsRef.current;
                  const url = cur.mode === "update" && cur.endpoints ? cur.endpoints.setupToken : "/api/billing/paypal/setup-token";
                  const res = await fetch(url, { method: "POST" });
                  const json = await res.json().catch(() => ({}));
                  if (!res.ok) {
                    report("create_order_failed", { ...ctx(), status: res.status, message: json.error, detail: json });
                    throw new Error(json.error || "Could not start card update");
                  }
                  orderIdRef.current = json.orderId;
                  return json.orderId as string;
                },
                onApprove: async (data: any) => {
                  const cur = propsRef.current;
                  const url = cur.mode === "update" && cur.endpoints ? cur.endpoints.paymentToken : "/api/billing/paypal/payment-token";
                  const res = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orderId: data.orderID }),
                  });
                  const json = await res.json().catch(() => ({}));
                  setSubmitting(false);
                  if (!res.ok) {
                    report("approve_failed", { ...ctx(), orderId: data.orderID, status: res.status, message: json.error, detail: json, shown: json.error || "Could not save card" });
                    setError(json.error || "Could not save card");
                    return;
                  }
                  doneRef.current = true;
                  report("success", { ...ctx(), orderId: data.orderID, detail: { liabilityShift: data.liabilityShift ?? null } });
                  propsRef.current.onSuccess(json);
                },
              }
        );

        if (!cardFields.isEligible()) {
          report("not_eligible", { ...ctx(), message: "CardFields.isEligible() is false" });
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
        }).catch((err: any) => {
          report("card_fields_error", { ...ctx(), message: `render failed: ${err?.message}`, detail: errDetail(err) });
          if (!cancelled) setError("Could not load the card form. Please refresh and try again.");
        });
      })
      .catch((err) => {
        report("sdk_load_failed", { ...ctx(), message: err?.message, detail: errDetail(err) });
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
  }, [clientId, currency, props.mode, theme]);

  async function submit() {
    if (!fieldsRef.current) return;
    setError(null);
    setSubmitting(true);
    orderIdRef.current = null;
    doneRef.current = false;
    const fields = await fieldState(fieldsRef.current);
    report("submit", { ...ctx(), fields: { ...(fields || {}), country, postcode: postcode.trim() ? "given" : "blank" } });
    try {
      // Resolves after onApprove/onError have run; rejects with PayPal's
      // own validation message if a field is invalid.
      const pc = postcode.trim();
      await fieldsRef.current.submit({
        billingAddress: { countryCode: country, ...(pc && !NO_POSTCODE.has(country) ? { postalCode: pc } : {}) },
      });
    } catch (err: any) {
      if (doneRef.current) return;
      const msg: string = err?.message || "";
      // Field-validation errors from the SDK read "…invalid…"; anything else
      // came from our server or PayPal and should be shown as-is.
      const shown =
        friendlyPayPalError(msg) ||
        (/^(invalid|incomplete)|is invalid|not valid/i.test(msg) ? "Please check the card details." : msg || "Something went wrong — please try again.");
      report("submit_rejected", { ...ctx(), message: msg, detail: errDetail(err), shown, fields });
      setError(shown);
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
  // PayPal sizes each iframe to its input plus ~9px of its own margin top
  // and bottom; a fixed 44px box with the frame nudged up centres the text.
  const frame = "h-11 overflow-hidden rounded-md shadow-xs transition-[border-color,box-shadow] focus-within:ring-[3px] [&>div]:-mt-[9px] [&_iframe]:block";
  const field =
    theme === "stampy"
      ? `${frame} border border-gray-300 bg-white focus-within:border-[#7c92e7] focus-within:ring-[#7c92e7]/30`
      : `${frame} border border-input bg-[#1b1b1b] focus-within:border-ring focus-within:ring-ring/50`;
  // Native inputs drawn to match the PayPal frames above.
  const plainInput =
    theme === "stampy"
      ? "h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-[15px] text-gray-800 shadow-xs outline-none placeholder:text-gray-400 focus:border-[#7c92e7] focus:ring-[3px] focus:ring-[#7c92e7]/30"
      : "h-11 w-full rounded-md border border-input bg-[#1b1b1b] px-3 text-[15px] text-stone-100 shadow-xs outline-none placeholder:text-stone-600 focus:border-ring focus:ring-[3px] focus:ring-ring/50";
  const label = theme === "stampy" ? "mb-1.5 block text-xs font-medium text-gray-600" : "mb-1.5 block text-xs font-medium text-muted-foreground";
  const submitCls =
    theme === "stampy"
      ? "h-11 w-full cursor-pointer bg-[#7c92e7] text-base text-white hover:bg-[#6a80d9]"
      : "h-11 w-full cursor-pointer bg-amber-700 text-base text-white hover:bg-amber-800";
  const noteCls = theme === "stampy" ? "text-gray-500" : "text-muted-foreground";

  return (
    <div ref={containerRef} className="space-y-4">
      <div>
        {!ready && !error && (
          <div className={`flex items-center gap-2 py-8 text-sm ${noteCls}`}>
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
          <div className={NO_POSTCODE.has(country) ? "" : "grid grid-cols-[1fr_9rem] gap-3"}>
            <div>
              <label htmlFor="pp-card-country" className={label}>Billing country</label>
              <select
                id="pp-card-country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                autoComplete="country"
                className={plainInput}
              >
                {countryNames.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>
            {!NO_POSTCODE.has(country) && (
              <div>
                <label htmlFor="pp-card-postcode" className={label}>Postcode</label>
                <input
                  id="pp-card-postcode"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                  autoComplete="postal-code"
                  inputMode="text"
                  maxLength={12}
                  placeholder={country === "AU" ? "3000" : country === "GB" ? "SW1A 1AA" : country === "US" ? "94105" : ""}
                  className={plainInput}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      {error && (
        <p className={theme === "stampy" ? "rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700" : "rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300"}>{error}</p>
      )}
      <Button
        className={submitCls}
        disabled={!ready || submitting}
        onClick={submit}
      >
        {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Lock className="mr-2 size-4" />}
        {submitLabel}
      </Button>
      <p className={`flex items-center justify-center gap-1.5 text-center text-xs ${noteCls}`}>
        <Lock className="size-3" /> Encrypted and processed by PayPal — card details never touch our servers.
      </p>
    </div>
  );
}
