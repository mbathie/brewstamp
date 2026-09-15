import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import { User } from "@/models";
import { enrolPartner, partnerSummary, referralLink, REFERRAL_MONTHS, REFERRAL_RATE_PERCENT } from "@/lib/referrals";

// The signed-in user's partner status + dashboard data.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const user = await User.findById(session.user.id).select("referralCode referralPartner referralPayoutEmail referralPartnerSince").lean<any>();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const base = { ratePercent: REFERRAL_RATE_PERCENT, months: REFERRAL_MONTHS };
  if (!user.referralPartner) return NextResponse.json({ ...base, partner: false });
  const summary = await partnerSummary(session.user.id);
  return NextResponse.json({
    ...base,
    partner: true,
    code: user.referralCode,
    link: referralLink(user.referralCode),
    payoutEmail: user.referralPayoutEmail ?? null,
    since: user.referralPartnerSince ?? null,
    ...summary,
  });
}

// Join the program (or update the payout email). Any signed-in user can
// become a partner — the program is open.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { payoutEmail?: string };
  const payoutEmail = body.payoutEmail?.trim();
  if (payoutEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(payoutEmail)) {
    return NextResponse.json({ error: "Enter a valid PayPal email for payouts." }, { status: 400 });
  }
  const user = await enrolPartner(session.user.id, payoutEmail);
  return NextResponse.json({ ok: true, code: user.referralCode, link: referralLink(user.referralCode) });
}
