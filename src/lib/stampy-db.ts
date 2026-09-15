// Access to the legacy StampyStamp database. Stampy lives in the same Mongo
// cluster as Brewstamp (db `stampy`, since its 2026-09-14 move off MySQL),
// so in production we reach it over Brewstamp's own connection with
// useDb(); STAMPY_MONGODB_URI overrides that for local dev or a split
// cluster. Brewstamp owns stampy's billing from here on: the cron charges
// stampy merchants' saved cards and writes the results back here.
//
// Collections we own in that db (created on first write):
//   billing_subscriptions — one per merchant, same shape as Brewstamp's
//                           Subscription doc (provider, plan, price, vault,
//                           dunning, migration token)
//   billing_payments      — one row per charge, same shape as Payment
// Stampy's own collections (Prisma models): Merchant, Customer, …

import mongoose, { type Connection } from "mongoose";
import type { Collection, Db, ObjectId } from "mongodb";
import { connectDB } from "./mongoose";

let external: Connection | null = null;

export async function getStampyDb(): Promise<Db> {
  const uri = process.env.STAMPY_MONGODB_URI;
  if (uri) {
    if (!external) {
      external = mongoose.createConnection(uri);
      await external.asPromise();
    }
    return external.db!;
  }
  await connectDB();
  return mongoose.connection.useDb("stampy", { useCache: true }).db!;
}

export interface StampyMerchant {
  _id: string; // cuid, printed in QR codes
  email: string;
  name?: string | null;
  stripe?: { customer?: { id?: string }; subscription?: { id?: string } } | null;
  deleted?: Date | null;
}

export interface StampySubscription {
  _id?: ObjectId;
  merchantId: string;
  merchantEmail: string;
  merchantName: string;
  provider: "stripe" | "paypal";
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripePriceId?: string | null;
  paypalVaultId?: string | null;
  paypalCustomerId?: string | null;
  card?: { brand?: string; last4?: string; expiry?: string } | null;
  planLabel: string; // "Bean"
  interval: "month" | "year";
  priceCents: number;
  currency: string; // "aud"
  status: "active" | "past_due" | "canceled";
  cancelAtPeriodEnd: boolean;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  failedAttempts: number;
  nextAttemptAt?: Date | null;
  lastPaymentAt?: Date | null;
  migrationToken?: string | null;
  migrationEmailedAt?: Date | null;
  migratedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StampyPayment {
  _id?: ObjectId;
  merchantId: string;
  subscriptionId?: ObjectId | null;
  provider: "stripe" | "paypal";
  stripeInvoiceId?: string | null;
  stripeChargeId?: string | null;
  hostedUrl?: string | null;
  orderId?: string | null;
  captureId?: string | null;
  paidAt: Date;
  kind: "initial" | "renewal" | "upgrade";
  status: "paid" | "failed" | "refunded" | "disputed";
  amountCents: number;
  currency: string;
  description?: string | null;
  periodStart?: Date | null;
  periodEnd?: Date | null;
  failureReason?: string | null;
  refundedCents: number;
  createdAt: Date;
}

export async function stampyCollections(): Promise<{
  merchants: Collection<StampyMerchant>;
  subscriptions: Collection<StampySubscription>;
  payments: Collection<StampyPayment>;
}> {
  const db = await getStampyDb();
  return {
    merchants: db.collection<StampyMerchant>("Merchant"),
    subscriptions: db.collection<StampySubscription>("billing_subscriptions"),
    payments: db.collection<StampyPayment>("billing_payments"),
  };
}

// Idempotent index setup — called by the backfill script and the cron.
export async function ensureStampyBillingIndexes() {
  const { subscriptions, payments } = await stampyCollections();
  await subscriptions.createIndex({ merchantId: 1 }, { unique: true });
  await subscriptions.createIndex({ migrationToken: 1 }, { unique: true, sparse: true });
  await subscriptions.createIndex({ provider: 1, status: 1, currentPeriodEnd: 1 });
  await payments.createIndex({ merchantId: 1, paidAt: -1 });
  await payments.createIndex({ stripeInvoiceId: 1 }, { unique: true, sparse: true });
  await payments.createIndex({ captureId: 1 }, { sparse: true });
}
