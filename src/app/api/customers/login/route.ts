import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongoose";
import { Customer } from "@/models";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  await connectDB();

  const { email, password } = await req.json().catch(() => ({}));

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  // password is select:false on the model — opt in for the comparison.
  const customer = await Customer.findOne({ email }).select("+password");

  if (!customer || !customer.password) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }

  const valid = await bcrypt.compare(password, customer.password);

  if (!valid) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }

  // Re-link: update cookieId to the current browser's cookie
  const cookieStore = await cookies();
  const currentCookieId = cookieStore.get("brewstamp_id")?.value;

  if (!currentCookieId) {
    return NextResponse.json(
      { error: "No brewstamp_id cookie found" },
      { status: 400 }
    );
  }

  // Delete the anonymous customer that was created for this new cookie
  await Customer.deleteOne({ cookieId: currentCookieId, _id: { $ne: customer._id } });

  // Update the returning customer's cookieId to the new one
  customer.cookieId = currentCookieId;
  await customer.save();

  // Never return the (now-loaded) password hash to the client.
  const safe = customer.toObject();
  delete safe.password;
  return NextResponse.json({ customer: safe });
}
