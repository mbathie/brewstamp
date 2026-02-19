import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    cookieId: { type: String, required: true, unique: true },
    name: { type: String },
    email: { type: String },
  },
  { timestamps: true }
);

const Customer =
  mongoose.models.Customer || mongoose.model("Customer", customerSchema);
export default Customer;
