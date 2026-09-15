// Thin PayPal REST client for card billing (Advanced Credit and Debit Card
// Payments + Vault). No SDK — the surface we use is small and the official
// Node SDK lags the v2 Orders / v3 Vault APIs.
//
// Env:
//   PAYPAL_ENV            sandbox | live            (default sandbox)
//   PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET          REST app credentials
//   NEXT_PUBLIC_PAYPAL_CLIENT_ID                     same client id, for the JS SDK
//   PAYPAL_WEBHOOK_ID                                for webhook signature checks
//   BILLING_PROVIDER      paypal | stripe            which provider NEW checkouts use

export type BillingProvider = "stripe" | "paypal";

export function billingProvider(): BillingProvider {
  return process.env.BILLING_PROVIDER === "paypal" ? "paypal" : "stripe";
}

export function paypalEnv(): "sandbox" | "live" {
  return process.env.PAYPAL_ENV === "live" ? "live" : "sandbox";
}

const API_BASE = () =>
  paypalEnv() === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

export class PayPalError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
  // PayPal's structured issue code ("INSTRUMENT_DECLINED", …), if any.
  get issue(): string | null {
    const b = this.body as { details?: Array<{ issue?: string }>; name?: string } | null;
    return b?.details?.[0]?.issue ?? b?.name ?? null;
  }
}

// ── OAuth ─────────────────────────────────────────────────────────────────

let tokenCache: { token: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.token;
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) throw new Error("PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET not set");
  const res = await fetch(`${API_BASE()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!res.ok || !json.access_token) throw new PayPalError("PayPal auth failed", res.status, json);
  tokenCache = { token: json.access_token, expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000 };
  return tokenCache.token;
}

async function api<T>(
  method: "GET" | "POST" | "DELETE",
  path: string,
  body?: unknown,
  opts?: { requestId?: string }
): Promise<T> {
  const token = await accessToken();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  // Idempotency key — a retried renewal must never double-charge.
  if (opts?.requestId) headers["PayPal-Request-Id"] = opts.requestId;
  const res = await fetch(`${API_BASE()}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg = json?.details?.[0]?.description || json?.message || `PayPal ${method} ${path} → ${res.status}`;
    throw new PayPalError(msg, res.status, json);
  }
  return json as T;
}

// ── Orders (v2) ───────────────────────────────────────────────────────────

export interface PayPalCardSummary {
  brand?: string;
  last4?: string;
  expiry?: string;
}

export interface PayPalOrder {
  id: string;
  status: string;
  purchase_units?: Array<{
    payments?: { captures?: Array<{ id: string; status: string; amount?: { value: string; currency_code: string } }> };
  }>;
  payment_source?: {
    card?: {
      brand?: string;
      last_digits?: string;
      expiry?: string;
      attributes?: { vault?: { id?: string; status?: string; customer?: { id?: string } } };
    };
  };
}

export const money = (cents: number, currency = "USD") => ({
  currency_code: currency.toUpperCase(),
  value: (cents / 100).toFixed(2),
});

// First charge from the billing page: the JS SDK's Card Fields attach the
// card to this order at submit time; ON_SUCCESS vaults it once the capture
// clears. Returns the order id the SDK needs.
export async function createCardOrder(opts: {
  amountCents: number;
  currency: string;
  description: string;
  customId: string; // our reference (shop id + plan) — echoed on the capture
  vault: boolean;
}): Promise<{ id: string }> {
  return api("POST", "/v2/checkout/orders", {
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: money(opts.amountCents, opts.currency),
        description: opts.description.slice(0, 127),
        custom_id: opts.customId.slice(0, 127),
      },
    ],
    payment_source: {
      card: {
        attributes: {
          ...(opts.vault ? { vault: { store_in_vault: "ON_SUCCESS" } } : {}),
          verification: { method: "SCA_WHEN_REQUIRED" },
        },
      },
    },
  });
}

export async function captureOrder(orderId: string): Promise<PayPalOrder> {
  return api("POST", `/v2/checkout/orders/${orderId}/capture`, {});
}

export async function getOrder(orderId: string): Promise<PayPalOrder> {
  return api("GET", `/v2/checkout/orders/${orderId}`);
}

// Merchant-initiated charge against a vaulted card (renewals, upgrades). An
// order created with a vault_id is processed immediately — no capture step.
// `requestId` makes the call idempotent for 72h: the same key returns the
// same order instead of charging twice.
export async function chargeVault(opts: {
  vaultId: string;
  amountCents: number;
  currency: string;
  description: string;
  customId: string;
  requestId: string;
}): Promise<PayPalOrder> {
  const order = await api<PayPalOrder>(
    "POST",
    "/v2/checkout/orders",
    {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: money(opts.amountCents, opts.currency),
          description: opts.description.slice(0, 127),
          custom_id: opts.customId.slice(0, 127),
        },
      ],
      payment_source: {
        card: {
          vault_id: opts.vaultId,
          stored_credential: {
            payment_initiator: "MERCHANT",
            payment_type: "RECURRING",
            usage: "SUBSEQUENT",
          },
        },
      },
    },
    { requestId: opts.requestId }
  );
  // Belt and braces: some flows leave the order APPROVED rather than
  // COMPLETED; capture it so the money actually moves.
  if (order.status === "APPROVED") return captureOrder(order.id);
  return order;
}

export function captureOf(order: PayPalOrder) {
  return order.purchase_units?.[0]?.payments?.captures?.[0] ?? null;
}

export function cardSummaryOf(order: PayPalOrder): PayPalCardSummary {
  const c = order.payment_source?.card;
  return { brand: c?.brand, last4: c?.last_digits, expiry: c?.expiry };
}

export async function refundCapture(captureId: string, amountCents?: number, currency = "USD") {
  return api<{ id: string; status: string }>(
    "POST",
    `/v2/payments/captures/${captureId}/refund`,
    amountCents == null ? {} : { amount: money(amountCents, currency) }
  );
}

// ── Vault (v3) — replacing a card without charging it ─────────────────────

// Step 1: a setup token the SDK's Card Fields fill in (createVaultSetupToken).
export async function createSetupToken(opts: { customerId?: string }): Promise<{ id: string }> {
  return api("POST", "/v3/vault/setup-tokens", {
    ...(opts.customerId ? { customer: { id: opts.customerId } } : {}),
    payment_source: {
      card: { verification_method: "SCA_WHEN_REQUIRED" },
    },
  });
}

// Step 2: after the customer approves, exchange it for a permanent token.
export interface PayPalPaymentToken {
  id: string;
  customer?: { id?: string };
  payment_source?: { card?: { brand?: string; last_digits?: string; expiry?: string } };
}
export async function createPaymentToken(setupTokenId: string): Promise<PayPalPaymentToken> {
  return api("POST", "/v3/vault/payment-tokens", {
    payment_source: { token: { id: setupTokenId, type: "SETUP_TOKEN" } },
  });
}

export async function deletePaymentToken(id: string): Promise<void> {
  try {
    await api("DELETE", `/v3/vault/payment-tokens/${id}`);
  } catch (e) {
    if (!(e instanceof PayPalError && e.status === 404)) throw e;
  }
}

// ── Webhooks ──────────────────────────────────────────────────────────────

export async function verifyWebhook(headers: Headers, rawBody: string): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) return false;
  const res = await api<{ verification_status: string }>("POST", "/v1/notifications/verify-webhook-signature", {
    auth_algo: headers.get("paypal-auth-algo"),
    cert_url: headers.get("paypal-cert-url"),
    transmission_id: headers.get("paypal-transmission-id"),
    transmission_sig: headers.get("paypal-transmission-sig"),
    transmission_time: headers.get("paypal-transmission-time"),
    webhook_id: webhookId,
    webhook_event: JSON.parse(rawBody),
  });
  return res.verification_status === "SUCCESS";
}
