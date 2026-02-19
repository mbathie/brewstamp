"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Gift } from "lucide-react";

interface StampRequestData {
  requestId: string;
  customerId: string;
  customerName: string;
  stamps: number;
  threshold: number;
  redeem: boolean;
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
    <Dialog
      open={!!request}
      onOpenChange={() => {
        onReject(request.requestId);
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-center text-xl">
            {request.customerName}
          </DialogTitle>
          <p className="text-center text-sm text-muted-foreground">
            Current stamps: {request.stamps} / {request.threshold}
          </p>
        </DialogHeader>

        {request.redeem ? (
          <div className="flex flex-col gap-4 py-4">
            <div className="flex items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
              <Gift className="h-5 w-5 text-amber-600" />
              <p className="text-sm font-medium text-amber-700">
                Wants to redeem a free drink
              </p>
            </div>

            <div className="flex flex-col items-center gap-2">
              <p className="text-sm font-medium text-muted-foreground">
                Also award stamps?
              </p>
              <div className="flex items-center gap-6">
                <Button
                  size="icon"
                  className="h-12 w-12 cursor-pointer rounded-full bg-amber-600 text-white hover:bg-amber-700"
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
                  className="h-12 w-12 cursor-pointer rounded-full bg-amber-600 text-white hover:bg-amber-700"
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
                className="flex-1 cursor-pointer bg-amber-600 hover:bg-amber-700"
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
                  className="h-14 w-14 cursor-pointer rounded-full bg-amber-600 text-white hover:bg-amber-700"
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
                  className="h-14 w-14 cursor-pointer rounded-full bg-amber-600 text-white hover:bg-amber-700"
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
                className="flex-1 cursor-pointer bg-amber-600 hover:bg-amber-700"
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
