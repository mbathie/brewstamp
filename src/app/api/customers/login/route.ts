import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongoose";
import { Customer } from "@/models";
import bcrypt from "bcrypt";
import { mergeCustomerInto } from "@/lib/customer-merge";

const ID_COOKIE = "brewstamp_id";
const ID_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 5; // match proxy.ts

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

  // A merged-away duplicate can share this email (merges copy details onto the
  // survivor); follow its pointer so the login lands on the surviving account.
  let account = customer;
  for (let hops = 0; account.mergedInto && hops < 5; hops++) {
    const next = await Customer.findById(account.mergedInto);
    if (!next) break;
    account = next;
  }

  // Re-link this browser to the account WITHOUT taking the account away from
  // its other browsers. This used to overwrite customer.cookieId with the new
  // browser's cookie, which orphaned the customer's original phone (its next
  // scan minted a brand-new, empty card), and it deleted this browser's
  // throwaway identity while leaving its card — and any stamps on it — behind.
  const cookieStore = await cookies();
  const currentCookieId = cookieStore.get(ID_COOKIE)?.value;

  if (!currentCookieId) {
    return NextResponse.json(
      { error: "No brewstamp_id cookie found" },
      { status: 400 }
    );
  }

  const current = await Customer.findOne({ cookieId: currentCookieId }).select("email mergedInto");
  if (current && String(current._id) !== String(account._id) && !current.mergedInto && !current.email) {
    // An anonymous identity this browser minted (e.g. the customer scanned
    // before logging in): fold its cards into the account and leave it as a
    // pointer, so this browser resolves to the account even if it ignores the
    // cookie swap below (some in-app browsers drop Set-Cookie on fetch).
    // A browser holding a different signed-up account is just switched over.
    try {
      await mergeCustomerInto(String(current._id), String(account._id));
    } catch (err) {
      console.error("[customer login] merge of anonymous identity failed:", err);
    }
  }

  // Point this browser at the account's cookie; every browser the customer
  // logs in on then shares one identity.
  cookieStore.set(ID_COOKIE, account.cookieId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: ID_COOKIE_MAX_AGE,
  });

  // Never return the (now-loaded) password hash to the client.
  const safe = account.toObject();
  delete safe.password;
  return NextResponse.json({ customer: safe });
}
