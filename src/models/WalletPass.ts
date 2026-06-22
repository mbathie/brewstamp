import mongoose from "mongoose";

// One row per (stamp card, provider) — the link between a Brewstamp StampCard
// and the pass that lives in a customer's Apple/Google Wallet. Lets us push
// updates (new stamp, redemption) to the right pass when the card changes.
const walletPassSchema = new mongoose.Schema(
  {
    card: { type: mongoose.Schema.Types.ObjectId, ref: "StampCard", required: true },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    provider: { type: String, enum: ["google", "apple"], required: true },
    // Google: the loyaltyObject id suffix. Apple: the pass serialNumber.
    serial: { type: String, required: true },
    // Apple only: token the wallet uses to authenticate web-service calls.
    authToken: { type: String },
    // Apple only: devices that registered for push updates of this pass.
    registrations: [
      {
        deviceLibraryIdentifier: { type: String },
        pushToken: { type: String },
        _id: false,
      },
    ],
    lastPushedAt: { type: Date },
  },
  { timestamps: true },
);

walletPassSchema.index({ card: 1, provider: 1 }, { unique: true });
walletPassSchema.index({ shop: 1 });

const WalletPass =
  mongoose.models.WalletPass || mongoose.model("WalletPass", walletPassSchema);
export default WalletPass;
