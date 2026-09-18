import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    cookieId: { type: String, required: true, unique: true },
    // Set when this row was folded into an earlier identity for the same
    // verified email (perk-mode reconcile). The row is kept — not deleted —
    // so a browser that never applied the swapped id cookie still resolves
    // to the right person via this pointer instead of minting a fresh
    // identity and looping back to "enter your email".
    mergedInto: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    name: { type: String },
    email: { type: String },
    // select:false so the bcrypt hash is never returned by default — routes that
    // need it (login) must opt in with .select("+password").
    password: { type: String, select: false },
    // Perk mode: staff must prove they control their work email before they can
    // claim a subsidised coffee, so a spoofed (but domain-valid) address like
    // fake@company.com can't redeem. Verified once per email, then persisted.
    emailVerified: { type: Boolean, default: false },
    emailVerifiedAt: { type: Date },
    // select:false — the verification code hash is a secret; only the confirm
    // route opts in via .select("+emailVerifyCodeHash").
    emailVerifyCodeHash: { type: String, select: false },
    emailVerifyExpires: { type: Date },
    // Magic-link alternative to the code (same expiry). Hashed at rest.
    emailVerifyLinkHash: { type: String, select: false, index: true, sparse: true },
    emailVerifyAttempts: { type: Number, default: 0 },
    // How many times this email has been verified at a perk shop, including
    // verifications from throwaway sessions that were merged into this record.
    // A high count means the person's phone keeps losing its cookie (camera-app
    // viewers, private browsing, a different browser). Otherwise untraceable,
    // because the merge deletes the duplicate record.
    perkVerifications: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Customer =
  mongoose.models.Customer || mongoose.model("Customer", customerSchema);
export default Customer;
