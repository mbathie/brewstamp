"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Stamp } from "lucide-react";
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
  } | null>(null);

  async function startCheckin(redeem = false) {
    const res = await fetch("/api/stamp-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shopId, customerId, redeem }),
    });

    if (!res.ok) {
      toast.error("Failed to create stamp request");
      return;
    }

    const data = await res.json();
    setRequestData({
      requestId: data.request._id,
      customerId,
      customerName,
      stamps,
      threshold,
      redeem,
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
          parts.push("free drink redeemed");
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

  return (
    <>
      <Button
        onClick={() => {
          if (stamps >= threshold) {
            // Let them choose via the modal — create as redeem
            startCheckin(true);
          } else {
            startCheckin(false);
          }
        }}
        className="cursor-pointer bg-amber-600 hover:bg-amber-700"
      >
        <Stamp className="mr-2 h-4 w-4" />
        Check in
      </Button>
      <StampRequestModal
        request={requestData}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </>
  );
}
