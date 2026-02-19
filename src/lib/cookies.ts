import { cookies } from "next/headers";
import { connectDB } from "./mongoose";
import { Customer } from "@/models";

export async function getOrCreateCustomer() {
  const cookieStore = await cookies();
  const cookieId = cookieStore.get("brewstamp_id")?.value;

  if (!cookieId) {
    throw new Error("brewstamp_id cookie not found — middleware should have set it");
  }

  await connectDB();
  let customer = await Customer.findOne({ cookieId });

  if (!customer) {
    customer = await Customer.create({ cookieId });
  }

  return customer;
}
