// Dev-only: exercise the authorize→vault→void path server-side in sandbox by
// attaching a test card to the verify order directly (the SDK does this in
// the browser for real customers).
import "../../src/lib/load-env";
import { createVerifyOrder, verifyAndVaultCard } from "../../src/lib/paypal";
(async () => {
  const order = await createVerifyOrder({ currency: "aud", customId: "dev:verify", description: "Card verification — dev" });
  console.log("order", order.id);
  // Attach a sandbox card via the confirm-payment-source endpoint (server-side stand-in for Card Fields).
  const id = process.env.PAYPAL_CLIENT_ID!, secret = process.env.PAYPAL_CLIENT_SECRET!;
  const tok = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", { method: "POST", headers: { Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"), "Content-Type": "application/x-www-form-urlencoded" }, body: "grant_type=client_credentials" }).then((r) => r.json());
  const confirm = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${order.id}/confirm-payment-source`, { method: "POST", headers: { Authorization: `Bearer ${tok.access_token}`, "Content-Type": "application/json" }, body: JSON.stringify({ payment_source: { card: { number: "4012000033330026", expiry: "2028-12", security_code: "123", name: "Test Merchant", attributes: { vault: { store_in_vault: "ON_SUCCESS" } } } } }) }).then((r) => r.json());
  console.log("confirm:", confirm.status, confirm.name ?? "", confirm.details?.[0]?.issue ?? "");
  const res = await verifyAndVaultCard(order.id);
  console.log("vaulted:", res.vaultId.slice(0, 6) + "…", res.card, "customer", res.customerId);
})().catch((e) => { console.error("FAIL", e.message, JSON.stringify(e.body).slice(0, 400)); process.exit(1); });
