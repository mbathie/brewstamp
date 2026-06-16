import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    cookieId: { type: String, required: true, unique: true },
    name: { type: String },
    email: { type: String },
    password: { type: String },
    // Perk mode: staff must prove they control their work email before they can
    // claim a subsidised coffee, so a spoofed (but domain-valid) address like
    // fake@company.com can't redeem. Verified once per email, then persisted.
    emailVerified: { type: Boolean, default: false },
    emailVerifiedAt: { type: Date },
    emailVerifyCodeHash: { type: String },
    emailVerifyExpires: { type: Date },
    emailVerifyAttempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Customer =
  mongoose.models.Customer || mongoose.model("Customer", customerSchema);
export default Customer;
