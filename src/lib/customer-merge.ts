// Fold one customer identity into another. Customers are identified by a
// browser cookie, so the same person can end up with two identities (a scan
// that opened a different browser, cleared data, a private tab). Merging moves
// the duplicate's stamps and history onto the surviving identity and leaves
// the duplicate row as a pointer (Customer.mergedInto), so the duplicate's
// browser resolves to the survivor from now on — see getOrCreateCustomer().
//
// Used by:
//   - the merchant "merge duplicate card" action (one shop's card), and
//   - customer login on a new browser (all of the throwaway identity's cards).
//
// Not transactional (local Mongo is standalone). Steps are ordered so a
// failure part-way leaves the stamps on the survivor, never lost: the
// survivor's card is updated before the duplicate's card is removed.

import { connectDB } from "@/lib/mongoose";
import { Customer, StampCard, StampRequest, WalletPass } from "@/models";
import { syncWalletPasses } from "@/lib/wallet";

export class MergeError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export interface MergeResult {
  /** Cards folded into an existing card of the survivor. */
  merged: number;
  /** Cards handed over whole (the survivor had no card at that shop). */
  moved: number;
  /** Whether the duplicate row now points at the survivor. */
  pointed: boolean;
}

/**
 * Merge `sourceId` into `targetId`.
 *
 * shopId set: only the card at that shop moves, and the merge is refused if the
 * source has cards at other shops — a merchant can vouch that two cards at
 * their shop are one person, not rewrite another shop's records.
 * shopId omitted: every card the source holds moves (the caller has proven the
 * two identities are the same person, e.g. by password).
 */
export async function mergeCustomerInto(
  sourceId: string,
  targetId: string,
  opts: { shopId?: string } = {},
): Promise<MergeResult> {
  await connectDB();
  if (sourceId === targetId) throw new MergeError("Pick a different card to merge.");

  const [source, target] = await Promise.all([
    Customer.findById(sourceId).select("+password"),
    Customer.findById(targetId).select("+password"),
  ]);
  if (!source || !target) throw new MergeError("Customer not found.", 404);
  if (source.mergedInto) throw new MergeError("That card has already been merged.");
  if (target.mergedInto) throw new MergeError("This card has been merged into another one.");

  const sourceCards = await StampCard.find({ customer: source._id });
  let cards = sourceCards;
  if (opts.shopId) {
    cards = sourceCards.filter((c) => String(c.shop) === opts.shopId);
    if (cards.length === 0) throw new MergeError("That customer has no card at this shop.", 404);
    if (sourceCards.length > cards.length) {
      throw new MergeError(
        "That customer also has a card at another Brewstamp shop, so it can't be merged from here. Contact support and we'll merge it for you.",
        409,
      );
    }
    const targetCard = await StampCard.exists({ shop: opts.shopId, customer: target._id });
    if (!targetCard) throw new MergeError("This customer has no card at this shop.", 404);
  }

  const result: MergeResult = { merged: 0, moved: 0, pointed: false };
  for (const card of cards) {
    const shop = card.shop;
    const keep = await StampCard.findOne({ shop, customer: target._id });

    if (!keep) {
      // The survivor has no card here yet: hand the whole card over.
      card.customer = target._id;
      await card.save();
      await WalletPass.updateMany({ card: card._id }, { $set: { customer: target._id } });
      await StampRequest.updateMany({ shop, customer: source._id }, { $set: { customer: target._id } });
      result.moved++;
      continue;
    }

    // Fold the balances together. Stamps can land above the threshold; the
    // redeem flow subtracts one reward's worth and keeps the rest.
    keep.stamps = (keep.stamps || 0) + (card.stamps || 0);
    keep.totalEarned = (keep.totalEarned || 0) + (card.totalEarned || 0);
    keep.freeRedeemed = (keep.freeRedeemed || 0) + (card.freeRedeemed || 0);
    const notes = [keep.notes, card.notes].map((n) => (n || "").trim()).filter(Boolean);
    keep.notes = [...new Set(notes)].join("\n\n");
    keep.tags = [...new Set([...(keep.tags || []), ...(card.tags || [])])];
    if (card.disabled) keep.disabled = true;
    await keep.save();

    // History follows the person.
    await StampRequest.updateMany({ shop, customer: source._id }, { $set: { customer: target._id } });

    // Wallet passes: move the duplicate's pass onto the kept card unless the
    // kept card already has one for that wallet (one pass per card+provider).
    const keptProviders = new Set(
      (await WalletPass.find({ card: keep._id }).select("provider").lean()).map((p: any) => p.provider),
    );
    for (const pass of await WalletPass.find({ card: card._id })) {
      if (keptProviders.has(pass.provider)) {
        await pass.deleteOne();
      } else {
        pass.card = keep._id;
        pass.customer = target._id;
        await pass.save();
        keptProviders.add(pass.provider);
      }
    }

    await card.deleteOne();
    void syncWalletPasses(String(keep._id));
    result.merged++;
  }

  // Carry saved details the survivor doesn't have, so a login or email the
  // customer set up on the duplicate still works.
  let changed = false;
  if (!target.name && source.name) (target.name = source.name), (changed = true);
  if (!target.email && source.email) {
    target.email = source.email;
    if (source.emailVerified) (target.emailVerified = true), (target.emailVerifiedAt = source.emailVerifiedAt);
    changed = true;
  }
  if (!target.password && source.password && (!target.email || target.email === source.email)) {
    target.password = source.password;
    changed = true;
  }
  if (changed) await target.save();

  // With no cards left, the duplicate becomes a pointer: its browser (cookie)
  // now resolves to the survivor instead of minting a fresh empty card.
  const remaining = await StampCard.countDocuments({ customer: source._id });
  if (remaining === 0) {
    await Customer.updateOne({ _id: source._id }, { $set: { mergedInto: target._id } });
    result.pointed = true;
  }
  return result;
}
