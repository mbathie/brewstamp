// Team management across shops. A login's access is its ShopMembership rows:
// one per shop, each with its own role, so the same person can be staff at
// two of a group's 25 shops and nowhere else. The shop switcher and every
// shop-scoped page already follow memberships, so granting or removing a
// shop here is all "permissions" means.
//
// Who can change what, per shop: the owner manages anyone but the owner;
// a manager manages staff only, and can't create managers.

import crypto from "crypto";
import { Types } from "mongoose";
import { Invite, Shop, ShopMembership } from "@/models";
import { hasStaffLogins } from "@/lib/plans";
import { getUserPlanLimits } from "@/lib/plan-limits";
import type { CurrentShopContext, MembershipRole } from "@/lib/shop-context";

export type TeamRole = "manager" | "staff";

export interface TeamShop {
  _id: string;
  name: string;
  myRole: MembershipRole;
  plan: { label: string; hasStaffLogins: boolean; staffLoginLimit: number | "unlimited" };
  /** Non-owner members plus live invites, against staffLoginLimit. */
  staffLoginsUsed: number;
}

/** Every shop the viewer belongs to, with its owner's plan and seats in use. */
export async function teamShops(ctx: CurrentShopContext): Promise<TeamShop[]> {
  const ids = ctx.memberships.map((m) => new Types.ObjectId(m.shopId));
  const [shops, members, invites] = await Promise.all([
    Shop.find({ _id: { $in: ids } }).select("name owner").lean<{ _id: Types.ObjectId; name: string; owner?: Types.ObjectId }[]>(),
    ShopMembership.aggregate<{ _id: Types.ObjectId; n: number }>([
      { $match: { shop: { $in: ids }, role: { $ne: "owner" } } },
      { $group: { _id: "$shop", n: { $sum: 1 } } },
    ]),
    Invite.aggregate<{ _id: Types.ObjectId; n: number }>([
      { $match: { shop: { $in: ids }, acceptedAt: { $exists: false }, expiresAt: { $gt: new Date() } } },
      { $group: { _id: "$shop", n: { $sum: 1 } } },
    ]),
  ]);

  // A group's shops share one owner, so this is usually a single lookup.
  const owners = [...new Set(shops.map((s) => s.owner?.toString()).filter((x): x is string => !!x))];
  const plans = new Map(
    await Promise.all(owners.map(async (o) => [o, (await getUserPlanLimits(o)).plan] as const)),
  );
  const used = new Map<string, number>();
  for (const r of [...members, ...invites]) used.set(r._id.toString(), (used.get(r._id.toString()) ?? 0) + r.n);

  const order = new Map(ctx.memberships.map((m, i) => [m.shopId, i]));
  return shops
    .map((s) => {
      const id = s._id.toString();
      const plan = s.owner ? plans.get(s.owner.toString()) : undefined;
      return {
        _id: id,
        name: s.name,
        myRole: ctx.memberships.find((m) => m.shopId === id)!.role,
        plan: plan
          ? { label: plan.label, hasStaffLogins: hasStaffLogins(plan), staffLoginLimit: plan.staffLoginLimit }
          : { label: "Free", hasStaffLogins: false, staffLoginLimit: 0 },
        staffLoginsUsed: used.get(id) ?? 0,
      };
    })
    .sort((a, b) => order.get(a._id)! - order.get(b._id)!);
}

/** Can the viewer give `role` at this shop, or change someone who holds `current` there? */
export function canAssign(myRole: MembershipRole, role: TeamRole, current?: MembershipRole): boolean {
  if (current === "owner") return false;
  if (myRole === "owner") return true;
  return myRole === "manager" && role === "staff" && (current === undefined || current === "staff");
}

/**
 * A new shop joins the owner's "all shops" team: everyone given access to all
 * the owner's shops gets it here too, in the same role, and pending all-shops
 * invites gain this shop. Call after the owner's own membership is created.
 */
export async function grantAllShopsAccess(ownerId: string, shopId: string): Promise<void> {
  const others = (await Shop.find({ owner: ownerId, _id: { $ne: shopId } }).select("_id").lean()).map((s) => s._id);
  if (!others.length) return;

  const plan = (await getUserPlanLimits(ownerId)).plan;
  if (!hasStaffLogins(plan)) return;
  let seats = plan.staffLoginLimit === "unlimited" ? Infinity : plan.staffLoginLimit;

  // One role per person: manager if they manage any of the shops.
  const members = await ShopMembership.find({ shop: { $in: others }, allShops: true, role: { $ne: "owner" } }).lean();
  const people = new Map<string, { role: TeamRole; invitedBy?: unknown }>();
  for (const m of members as any[]) {
    const id = m.user.toString();
    if (id === ownerId) continue;
    const prev = people.get(id);
    if (!prev || m.role === "manager") people.set(id, { role: m.role, invitedBy: m.invitedBy });
  }
  for (const [user, p] of people) {
    if (seats <= 0) break;
    const done = await ShopMembership.updateOne(
      { user, shop: shopId },
      { $setOnInsert: { role: p.role, invitedBy: p.invitedBy, acceptedAt: new Date(), allShops: true } },
      { upsert: true },
    );
    if (done.upsertedCount) seats--;
  }

  const invites = await Invite.find({
    shop: { $in: others },
    allShops: true,
    acceptedAt: { $exists: false },
    expiresAt: { $gt: new Date() },
  }).lean();
  const byEmail = new Map<string, any>();
  for (const inv of invites as any[]) {
    const prev = byEmail.get(inv.email);
    if (!prev || inv.role === "manager") byEmail.set(inv.email, inv);
  }
  for (const inv of byEmail.values()) {
    if (seats <= 0) break;
    await Invite.create({
      shop: shopId,
      email: inv.email,
      role: inv.role,
      token: crypto.randomBytes(24).toString("hex"),
      invitedBy: inv.invitedBy,
      expiresAt: inv.expiresAt,
      allShops: true,
    });
    seats--;
  }
}

export function seatFree(shop: TeamShop): boolean {
  return (
    shop.plan.hasStaffLogins &&
    (shop.plan.staffLoginLimit === "unlimited" || shop.staffLoginsUsed < shop.plan.staffLoginLimit)
  );
}

/** "Bondi", "Bondi and Manly", "Bondi, Manly and 3 more". */
export function shopList(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names[0]}, ${names[1]} and ${names.length - 2} more`;
}
