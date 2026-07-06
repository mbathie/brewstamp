import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    cookieId: { type: String, required: true, unique: true },
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
    emailVerifyAttempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Customer =
  mongoose.models.Customer || mongoose.model("Customer", customerSchema);
export default Customer;
