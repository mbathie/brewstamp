"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, Gift, StickyNote, Crown, Coffee, Lock, ArrowRight } from "lucide-react";

interface StampRequestData {
  requestId: string;
  customerId: string;
  customerName: string;
  stamps: number;
  threshold: number;
  redeem: boolean;
  // Perk-mode (employer-subsidised) request: a single free drink, no stamps.
  perk?: boolean;
  perkRemaining?: number;
  tags?: string[];
  notes?: string;
  isTopCustomer?: boolean;
}

interface Props {
  request: StampRequestData | null;
  onApprove: (requestId: string, stampsAwarded: number, redeem: boolean) => void;
  onReject: (requestId: string) => void;
  // Free-plan stamp allowance still available, or null when the shop has a
  // paid plan (unlimited). At 0 the modal swaps the award controls for an
  // upgrade prompt — the server would refuse the stamps anyway.
  freeStampsLeft?: number | null;
  freeStampLimit?: number;
}

export default function StampRequestModal({
  request,
  onApprove,
  onReject,
  freeStampsLeft = null,
  freeStampLimit = 100,
}: Props) {
  const [stampsToAward, setStampsToAward] = useState(1);
  const [redeemStamps, setRedeemStamps] = useState(0);
  const router = useRouter();

  if (!request) return null;

  // Perk requests award no stamps, so the free limit never applies to them.
  const atLimit = !request.perk && freeStampsLeft != null && freeStampsLeft <= 0;
  // Cap the counter at what's left, so a near-limit shop can't queue up a
  // +5 that the server will reject.
  const maxAward = freeStampsLeft == null ? 10 : Math.max(1, Math.min(10, freeStampsLeft));
  const maxRedeemAward = freeStampsLeft == null ? 10 : Math.max(0, Math.min(10, freeStampsLeft));

  return (
    <Dialog open={!!request}>
      <DialogContent
        className="sm:max-w-sm"
        showCloseButton={false}
        // Force the merchant to make an explicit Approve/Decline choice.
        // Without these guards an accidental click outside the modal — or
        // an Escape press — would silently reject the customer's stamp.
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="pb-2">
          <DialogTitle className="text-center text-xl">
            {request.customerName}
          </DialogTitle>
          {!request.perk && (
            <p className="text-center text-sm text-muted-foreground">
              Current stamps: {request.stamps} / {request.threshold}
            </p>
          )}
          {request.isTopCustomer && (
            <div className="mt-2 flex justify-center">
              <Badge className="border-amber-500/40 bg-amber-500/15 font-medium text-amber-500 hover:bg-amber-500/15">
                <Crown className="mr-1 h-3.5 w-3.5" />
                Top customer
              </Badge>
            </div>
          )}
          {request.tags && request.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap justify-center gap-1.5">
              {request.tags.map((t) => (
                <Badge
                  key={t}
                  variant="outline"
                  className="border-amber-500/50 font-normal text-amber-500"
                >
                  {t}
                </Badge>
              ))}
            </div>
          )}
          {request.notes && request.notes.trim() && (
            <div className="mt-2 flex items-start gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-left text-sm text-muted-foreground">
              <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="line-clamp-3 leading-snug">{request.notes}</p>
            </div>
          )}
        </DialogHeader>

        {atLimit ? (
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-4 text-center">
              <Lock className="h-6 w-6 text-red-400" />
              <p className="text-sm font-semibold text-red-300">
                Free plan limit reached
              </p>
              <p className="text-sm text-muted-foreground">
                You&apos;ve used all {freeStampLimit}{" "}stamps on the Free plan, so this
                stamp can&apos;t be awarded. Pick a plan to keep stamping — your
                customers, cards and history all carry over.
              </p>
            </div>
            <Button
              className="w-full cursor-pointer bg-amber-700 hover:bg-amber-800"
              size="lg"
              onClick={() => {
                // The request can't be fulfilled until the shop upgrades, so
                // decline it (closes the dialog, tells the customer) and go
                // straight to the plans.
                onReject(request.requestId);
                router.push("/dashboard/billing");
              }}
            >
              Choose a plan <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => onReject(request.requestId)}
                className="flex-1 cursor-pointer"
                size="lg"
              >
                Decline request
              </Button>
              {request.redeem && (
                <Button
                  variant="outline"
                  onClick={() => onApprove(request.requestId, 0, true)}
                  className="flex-1 cursor-pointer border-amber-500/40 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400"
                  size="lg"
                >
                  <Gift className="mr-1.5 h-4 w-4" />
                  Redeem only
                </Button>
              )}
            </div>
            <p className="text-center text-xs text-muted-foreground">
              {request.redeem
                ? "Redeeming a reward doesn't use a stamp, so you can still honour it."
                : "The customer will be told to try again once you've upgraded."}
            </p>
          </div>
        ) : request.perk ? (
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col items-center gap-1 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-4">
              <Coffee className="h-6 w-6 text-amber-700" />
              <p className="text-sm font-medium text-amber-700">
                Free reward
              </p>
              {typeof request.perkRemaining === "number" && (
                <p className="text-xs text-muted-foreground">
                  {request.perkRemaining} left today after this
                </p>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => onReject(request.requestId)}
                className="flex-1 cursor-pointer"
                size="lg"
              >
                Decline
              </Button>
              <Button
                onClick={() => onApprove(request.requestId, 0, true)}
                className="flex-1 cursor-pointer bg-amber-700 hover:bg-amber-800"
                size="lg"
              >
                Approve free reward
              </Button>
            </div>
          </div>
        ) : request.redeem ? (
          <div className="flex flex-col gap-4 py-4">
            <div className="flex items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
              <Gift className="h-5 w-5 text-amber-700" />
              <p className="text-sm font-medium text-amber-700">
                Wants to redeem a reward
              </p>
            </div>

            <div className="flex flex-col items-center gap-2">
              <p className="text-sm font-medium text-muted-foreground">
                Also award stamps?
              </p>
              <div className="flex items-center gap-6">
                <Button
                  size="icon"
                  className="h-12 w-12 cursor-pointer rounded-full bg-amber-700 text-white hover:bg-amber-800"
                  onClick={() => setRedeemStamps(Math.max(0, redeemStamps - 1))}
                  disabled={redeemStamps <= 0}
                >
                  <Minus className="h-5 w-5" />
                </Button>
                <span className="min-w-[3rem] text-center text-3xl font-bold">
                  {redeemStamps}
                </span>
                <Button
                  size="icon"
                  className="h-12 w-12 cursor-pointer rounded-full bg-amber-700 text-white hover:bg-amber-800"
                  onClick={() => setRedeemStamps(Math.min(maxRedeemAward, redeemStamps + 1))}
                  disabled={redeemStamps >= maxRedeemAward}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => onReject(request.requestId)}
                className="flex-1 cursor-pointer"
                size="lg"
              >
                Decline
              </Button>
              <Button
                onClick={() => {
                  onApprove(request.requestId, redeemStamps, true);
                  setRedeemStamps(0);
                }}
                className="flex-1 cursor-pointer bg-amber-700 hover:bg-amber-800"
                size="lg"
              >
                Approve
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center gap-2 py-4">
              <p className="text-sm font-medium text-muted-foreground">
                Stamps to award
              </p>
              {freeStampsLeft != null && freeStampsLeft <= 10 && (
                <p className="text-xs text-amber-400">
                  {freeStampsLeft} free stamp{freeStampsLeft === 1 ? "" : "s"} left —{" "}
                  <Link href="/dashboard/billing" className="underline underline-offset-2">upgrade</Link>
                </p>
              )}
              <div className="flex items-center gap-6">
                <Button
                  size="icon"
                  className="h-14 w-14 cursor-pointer rounded-full bg-amber-700 text-white hover:bg-amber-800"
                  onClick={() =>
                    setStampsToAward(Math.max(1, stampsToAward - 1))
                  }
                  disabled={stampsToAward <= 1}
                >
                  <Minus className="h-6 w-6" />
                </Button>
                <span className="min-w-[3rem] text-center text-4xl font-bold">
                  {stampsToAward}
                </span>
                <Button
                  size="icon"
                  className="h-14 w-14 cursor-pointer rounded-full bg-amber-700 text-white hover:bg-amber-800"
                  onClick={() =>
                    setStampsToAward(Math.min(maxAward, stampsToAward + 1))
                  }
                  disabled={stampsToAward >= maxAward}
                >
                  <Plus className="h-6 w-6" />
                </Button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => onReject(request.requestId)}
                className="flex-1 cursor-pointer"
                size="lg"
              >
                Decline
              </Button>
              <Button
                onClick={() => {
                  onApprove(request.requestId, stampsToAward, false);
                  setStampsToAward(1);
                }}
                className="flex-1 cursor-pointer bg-amber-700 hover:bg-amber-800"
                size="lg"
              >
                Approve (+{stampsToAward})
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
