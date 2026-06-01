"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, Gift, StickyNote, Crown } from "lucide-react";

interface StampRequestData {
  requestId: string;
  customerId: string;
  customerName: string;
  stamps: number;
  threshold: number;
  redeem: boolean;
  tags?: string[];
  notes?: string;
  isTopCustomer?: boolean;
}

interface Props {
  request: StampRequestData | null;
  onApprove: (requestId: string, stampsAwarded: number, redeem: boolean) => void;
  onReject: (requestId: string) => void;
}

export default function StampRequestModal({
  request,
  onApprove,
  onReject,
}: Props) {
  const [stampsToAward, setStampsToAward] = useState(1);
  const [redeemStamps, setRedeemStamps] = useState(0);

  if (!request) return null;

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
          <p className="text-center text-sm text-muted-foreground">
            Current stamps: {request.stamps} / {request.threshold}
          </p>
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

        {request.redeem ? (
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
                  onClick={() => setRedeemStamps(Math.min(10, redeemStamps + 1))}
                  disabled={redeemStamps >= 10}
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
                    setStampsToAward(Math.min(10, stampsToAward + 1))
                  }
                  disabled={stampsToAward >= 10}
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
