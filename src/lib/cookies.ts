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

  // Follow merge pointers to the surviving identity (bounded, in case of a
  // cycle from some future bad write). The cookie itself is left alone —
  // the pointer makes it resolve correctly for as long as it lives.
  for (let hops = 0; customer?.mergedInto && hops < 5; hops++) {
    const next = await Customer.findById(customer.mergedInto);
    if (!next) break;
    customer = next;
  }

  if (!customer) {
    customer = await Customer.create({ cookieId });
  }

  return customer;
}
