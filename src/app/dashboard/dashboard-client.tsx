"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useWebSocket } from "@/lib/websocket";
import StampRequestModal from "@/components/stamp-request-modal";
import { toast } from "sonner";

interface StampRequestData {
  requestId: string;
  customerId: string;
  customerName: string;
  stamps: number;
  threshold: number;
  redeem: boolean;
}

interface Props {
  shopCode: string;
  shopId: string;
  threshold: number;
}

export default function DashboardClient({ shopCode, shopId, threshold }: Props) {
  const router = useRouter();
  const [currentRequest, setCurrentRequest] = useState<StampRequestData | null>(null);
  const currentRequestRef = useRef<StampRequestData | null>(null);
  const { connected, send, on } = useWebSocket(shopCode, "merchant", "merchant");

  // Keep ref in sync so the event handler always has the latest value
  useEffect(() => {
    currentRequestRef.current = currentRequest;
  }, [currentRequest]);

  useEffect(() => {
    const unsub = on("stamp-request:new", (msg: any) => {
      const request: StampRequestData = {
        requestId: msg.requestId,
        customerId: msg.customerId,
        customerName: msg.customerName || "Anonymous",
        stamps: msg.stamps,
        threshold: msg.threshold || threshold,
        redeem: !!msg.redeem,
      };

      // If there's already a pending request, cancel it
      const prev = currentRequestRef.current;
      if (prev) {
        fetch(`/api/stamp-request/${prev.requestId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "rejected" }),
        });
        send({
          type: "stamp-request:rejected",
          requestId: prev.requestId,
          customerId: prev.customerId,
        });
      }

      setCurrentRequest(request);
    });

    return unsub;
  }, [on, threshold, send]);

  const handleApprove = useCallback(
    async (requestId: string, stampsAwarded: number, redeem: boolean) => {
      const res = await fetch(`/api/stamp-request/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved", stampsAwarded, redeem }),
      });

      if (res.ok) {
        const data = await res.json();
        const name = currentRequest?.customerName || "Customer";
        send({
          type: "stamp-request:approved",
          requestId,
          customerId: currentRequest?.customerId,
          stampsAwarded,
          redeemed: redeem,
          newStamps: data.stampCard.stamps,
          newTotalEarned: data.stampCard.totalEarned,
          newFreeRedeemed: data.stampCard.freeRedeemed,
        });
        router.refresh();
        window.dispatchEvent(new Event("stamp-approved"));

        const parts: string[] = [];
        if (stampsAwarded > 0) {
          parts.push(`+${stampsAwarded} stamp${stampsAwarded > 1 ? "s" : ""} awarded`);
        }
        if (redeem) {
          parts.push("free drink redeemed");
        }
        parts.push(`(${data.stampCard.stamps}/${threshold} stamps)`);
        toast.success(`${name} — ${parts.join(", ")}`);
      }

      setCurrentRequest(null);
    },
    [currentRequest, send, router]
  );

  const handleReject = useCallback(
    async (requestId: string) => {
      await fetch(`/api/stamp-request/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });

      send({
        type: "stamp-request:rejected",
        requestId,
        customerId: currentRequest?.customerId,
      });

      setCurrentRequest(null);
    },
    [currentRequest, send]
  );

  return (
    <>
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`}
        />
        <span className="text-sm text-muted-foreground">
          {connected ? "Live" : "Disconnected"}
        </span>
      </div>
      <StampRequestModal
        request={currentRequest}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </>
  );
}
