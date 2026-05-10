"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Gift, Stamp } from "lucide-react";
import StampRequestModal from "@/components/stamp-request-modal";
import { toast } from "sonner";

interface Props {
  shopId: string;
  customerId: string;
  customerName: string;
  stamps: number;
  threshold: number;
}

export default function MerchantCheckin({
  shopId,
  customerId,
  customerName,
  stamps,
  threshold,
}: Props) {
  const router = useRouter();
  const [requestData, setRequestData] = useState<{
    requestId: string;
    customerId: string;
    customerName: string;
    stamps: number;
    threshold: number;
    redeem: boolean;
    tags?: string[];
    notes?: string;
  } | null>(null);

  async function startCheckin(redeem = false) {
    const [reqRes, notesRes] = await Promise.all([
      fetch("/api/stamp-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, customerId, redeem }),
      }),
      fetch(`/api/customers/${customerId}/notes`),
    ]);

    if (!reqRes.ok) {
      toast.error("Failed to create stamp request");
      return;
    }

    const data = await reqRes.json();
    let tags: string[] | undefined;
    let notes: string | undefined;
    if (notesRes.ok) {
      const n = await notesRes.json();
      tags = n.tags || [];
      notes = n.notes || "";
    }

    setRequestData({
      requestId: data.request._id,
      customerId,
      customerName,
      stamps,
      threshold,
      redeem,
      tags,
      notes,
    });
  }

  const handleApprove = useCallback(
    async (requestId: string, stampsAwarded: number, redeem: boolean) => {
      const res = await fetch(`/api/stamp-request/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved", stampsAwarded, redeem }),
      });

      if (res.ok) {
        const data = await res.json();
        const parts: string[] = [];
        if (stampsAwarded > 0) {
          parts.push(`+${stampsAwarded} stamp${stampsAwarded > 1 ? "s" : ""}`);
        }
        if (redeem) {
          parts.push("reward redeemed");
        }
        parts.push(`(${data.stampCard.stamps}/${threshold} stamps)`);
        toast.success(`${customerName} — ${parts.join(", ")}`);
        router.refresh();
        window.dispatchEvent(new Event("stamp-approved"));
      }

      setRequestData(null);
    },
    [customerName, threshold, router]
  );

  const handleReject = useCallback(
    async (requestId: string) => {
      await fetch(`/api/stamp-request/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });
      setRequestData(null);
    },
    []
  );

  const canRedeem = stamps >= threshold;

  return (
    <>
      <Button
        onClick={() => startCheckin(canRedeem)}
        className={`cursor-pointer ${
          canRedeem
            ? "bg-emerald-600 hover:bg-emerald-700"
            : "bg-amber-700 hover:bg-amber-800"
        }`}
      >
        {canRedeem ? (
          <Gift className="mr-2 h-4 w-4" />
        ) : (
          <Stamp className="mr-2 h-4 w-4" />
        )}
        {canRedeem ? "Redeem free drink" : "Check in"}
      </Button>
      <StampRequestModal
        request={requestData}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </>
  );
}
