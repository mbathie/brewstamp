"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// "Remove stamps" for owners and managers: fixes a stamp given by mistake or a
// double scan. The removal is logged in the customer's history with who did
// it and the reason.
export default function RemoveStampsDialog({
  shopId,
  customerId,
  displayName,
  stamps,
  threshold,
}: {
  shopId: string;
  customerId: string;
  displayName: string;
  stamps: number;
  threshold: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(1);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  function reset(next: boolean) {
    setOpen(next);
    if (next) {
      setAmount(1);
      setReason("");
    }
  }

  async function remove() {
    setSaving(true);
    try {
      const res = await fetch(`/api/customers/${customerId}/adjust`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, stamps: amount, reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Couldn't remove stamps.");
        return;
      }
      toast.success(
        `Removed ${amount} stamp${amount === 1 ? "" : "s"} from ${displayName} (${data.stampCard.stamps}/${threshold}).`,
      );
      setOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="cursor-pointer"
        onClick={() => reset(true)}
      >
        <Minus className="mr-1 size-3.5" />
        Remove stamps
      </Button>
      <Dialog open={open} onOpenChange={reset}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove stamps</DialogTitle>
            <DialogDescription>
              Takes stamps off {displayName}&apos;s card, for example one given
              by mistake. It&apos;s recorded in their history.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Stamps to remove</Label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="cursor-pointer"
                  onClick={() => setAmount((n) => Math.max(1, n - 1))}
                  disabled={amount <= 1}
                  aria-label="Fewer"
                >
                  <Minus className="size-4" />
                </Button>
                <span className="w-8 text-center text-2xl font-semibold tabular-nums">
                  {amount}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="cursor-pointer"
                  onClick={() => setAmount((n) => Math.min(stamps, n + 1))}
                  disabled={amount >= stamps}
                  aria-label="More"
                >
                  <Plus className="size-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {stamps} → {stamps - amount} of {threshold}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="remove-reason">Reason (optional)</Label>
              <Input
                id="remove-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. stamped twice by mistake"
                maxLength={200}
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={remove}
                disabled={saving}
                className="cursor-pointer bg-red-600 hover:bg-red-700"
              >
                {saving
                  ? "Removing…"
                  : `Remove ${amount} stamp${amount === 1 ? "" : "s"}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
