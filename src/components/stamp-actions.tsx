"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Gift, Minus, Plus } from "lucide-react";
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
import { Hint } from "@/components/ui/hint";

type Mode = "add" | "remove" | "redeem";

const MAX_ADD = 10;

const STAFF_HINT =
  "Only the owner or a manager can change stamps here. Customers' own scans still come to you to approve.";

// The stamp controls on a customer's page: add stamps, redeem a reward, and
// (owners and managers) remove stamps. All three use the same dialog, and
// nothing is recorded until it's confirmed. Adding and redeeming go through
// the normal stamp-request approval, so the free-trial limit, wallet passes
// and history behave exactly as for a scan at the counter (the server allows
// them for owners and managers only); removing is logged
// as an "adjusted" row with who did it and why. Perk shops keep no stamps, so
// they get a single "Give free reward" in the same dialog.
export default function StampActions({
  shopId,
  customerId,
  displayName,
  stamps,
  threshold,
  canManage,
  perk = false,
}: {
  shopId: string;
  customerId: string;
  displayName: string;
  stamps: number;
  threshold: number;
  // Owners and managers. Staff see the buttons, disabled, with the reason.
  canManage: boolean;
  perk?: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode | null>(null);
  const [amount, setAmount] = useState(1);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const canRedeem = stamps >= threshold;
  const min = mode === "redeem" ? 0 : 1;
  const max = mode === "remove" ? stamps : MAX_ADD;

  function open(next: Mode) {
    setMode(next);
    setAmount(next === "redeem" ? 0 : 1);
    setReason("");
  }

  const after =
    mode === "remove"
      ? stamps - amount
      : mode === "redeem"
        ? stamps - threshold + amount
        : stamps + amount;

  async function addOrRedeem(redeem: boolean): Promise<number | null> {
    const created = await fetch("/api/stamp-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shopId, customerId, redeem, manual: true }),
    });
    const createdData = await created.json().catch(() => ({}));
    if (!created.ok) {
      toast.error(createdData.error || "Couldn't update the card.");
      return null;
    }
    const requestId = createdData.request._id;
    const res = await fetch(`/api/stamp-request/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "approved",
        stampsAwarded: amount,
        redeem,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) return data.stampCard.stamps;
    if (data.code === "LIMIT_REACHED") {
      // Close the request so it doesn't pop up again as a pending scan.
      await fetch(`/api/stamp-request/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });
      toast.error(data.error, {
        action: {
          label: "Plans",
          onClick: () => router.push("/dashboard/billing"),
        },
      });
      return null;
    }
    toast.error(data.error || "Couldn't update the card.");
    return null;
  }

  async function remove(): Promise<number | null> {
    const res = await fetch(`/api/customers/${customerId}/adjust`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shopId, stamps: amount, reason }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.error || "Couldn't remove stamps.");
      return null;
    }
    return data.stampCard.stamps;
  }

  async function confirm() {
    if (!mode) return;
    setSaving(true);
    try {
      const now =
        mode === "remove"
          ? await remove()
          : await addOrRedeem(mode === "redeem");
      if (now == null) return;
      const n = `${amount} stamp${amount === 1 ? "" : "s"}`;
      toast.success(
        perk
          ? `Free reward given to ${displayName}.`
          : mode === "remove"
            ? `Removed ${n} from ${displayName} (${now}/${threshold}).`
            : mode === "redeem"
              ? `Reward redeemed for ${displayName}${amount ? `, +${n}` : ""} (${now}/${threshold}).`
              : `${displayName}: +${n} (${now}/${threshold}).`,
      );
      setMode(null);
      router.refresh();
      window.dispatchEvent(new Event("stamp-approved"));
    } finally {
      setSaving(false);
    }
  }

  const title = perk
    ? "Give free reward"
    : mode === "remove"
      ? "Remove stamps"
      : mode === "redeem"
        ? "Redeem reward"
        : "Add stamps";
  const confirmLabel = perk
    ? "Give free reward"
    : mode === "remove"
      ? `Remove ${amount}`
      : mode === "redeem"
        ? amount
          ? `Redeem + add ${amount}`
          : "Redeem reward"
        : `Add ${amount}`;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {perk ? (
          <Hint
            label={
              canManage ? `Record a free reward for ${displayName}` : STAFF_HINT
            }
          >
            <Button
              size="sm"
              className="cursor-pointer bg-amber-700 text-white hover:bg-amber-800"
              onClick={() => open("redeem")}
              disabled={!canManage}
            >
              <Gift className="mr-1 size-3.5" />
              Give free reward
            </Button>
          </Hint>
        ) : (
          <>
            <Hint
              label={
                !canManage
                  ? STAFF_HINT
                  : stamps === 0
                    ? "The card has no stamps to remove"
                    : "Take stamps off the card, e.g. one given by mistake"
              }
            >
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={() => open("remove")}
                disabled={!canManage || stamps === 0}
              >
                <Minus className="mr-1 size-3.5" />
                Remove
              </Button>
            </Hint>
            <Hint
              label={
                canManage
                  ? "Add stamps without the customer scanning"
                  : STAFF_HINT
              }
            >
              <Button
                size="sm"
                className="cursor-pointer bg-amber-700 text-white hover:bg-amber-800"
                onClick={() => open("add")}
                disabled={!canManage}
              >
                <Plus className="mr-1 size-3.5" />
                Add stamps
              </Button>
            </Hint>
            {canRedeem && (
              <Hint
                label={
                  canManage
                    ? `Use ${threshold} stamps for ${displayName}'s reward`
                    : STAFF_HINT
                }
              >
                <Button
                  size="sm"
                  className="cursor-pointer bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={() => open("redeem")}
                  disabled={!canManage}
                >
                  <Gift className="mr-1 size-3.5" />
                  Redeem reward
                </Button>
              </Hint>
            )}
          </>
        )}
      </div>

      <Dialog open={!!mode} onOpenChange={(o) => !o && setMode(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              {perk
                ? `Records a free reward for ${displayName}. It counts toward their daily limit.`
                : mode === "remove"
                  ? `Takes stamps off ${displayName}'s card, for example one given by mistake. It's recorded in their history.`
                  : mode === "redeem"
                    ? `Uses ${threshold} stamps for ${displayName}'s reward. You can add stamps for today's purchase at the same time.`
                    : `Adds stamps to ${displayName}'s card, as if they'd scanned at the counter.`}
            </DialogDescription>
          </DialogHeader>

          {!perk && (
            <div className="flex flex-col items-center gap-3 py-2">
              <p className="text-sm font-medium text-muted-foreground">
                {mode === "remove"
                  ? "Stamps to remove"
                  : mode === "redeem"
                    ? "Also add stamps?"
                    : "Stamps to add"}
              </p>
              <div className="flex items-center gap-6">
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="size-12 cursor-pointer rounded-full"
                  onClick={() => setAmount((n) => Math.max(min, n - 1))}
                  disabled={amount <= min}
                  aria-label="Fewer"
                  title="One fewer"
                >
                  <Minus className="size-5" />
                </Button>
                <span className="min-w-[3rem] text-center text-4xl font-bold tabular-nums">
                  {amount}
                </span>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="size-12 cursor-pointer rounded-full"
                  onClick={() => setAmount((n) => Math.min(max, n + 1))}
                  disabled={amount >= max}
                  aria-label="More"
                  title="One more"
                >
                  <Plus className="size-5" />
                </Button>
              </div>
              <p className="text-sm tabular-nums text-muted-foreground">
                {stamps} →{" "}
                <span className="font-medium text-foreground">{after}</span> of{" "}
                {threshold} stamps
                {mode !== "remove" && after >= threshold && (
                  <span className="text-emerald-500"> · reward ready</span>
                )}
              </p>
            </div>
          )}

          {mode === "remove" && (
            <div className="space-y-2">
              <Label htmlFor="stamp-reason">Reason (optional)</Label>
              <Input
                id="stamp-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. stamped twice by mistake"
                maxLength={200}
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setMode(null)}
              className="flex-1 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={confirm}
              disabled={saving}
              className={`flex-1 cursor-pointer text-white ${
                mode === "remove"
                  ? "bg-red-600 hover:bg-red-700"
                  : mode === "redeem" && !perk
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-amber-700 hover:bg-amber-800"
              }`}
            >
              {saving ? "Saving…" : confirmLabel}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
