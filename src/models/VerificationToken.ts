import mongoose from "mongoose";

const verificationTokenSchema = new mongoose.Schema({
  identifier: { type: String, required: true },
  token: { type: String, required: true, unique: true },
  expires: { type: Date, required: true },
});

verificationTokenSchema.index({ identifier: 1, token: 1 }, { unique: true });

const VerificationToken =
  mongoose.models.VerificationToken ||
  mongoose.model("VerificationToken", verificationTokenSchema);
export default VerificationToken;
