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
  perk?: boolean;
  perkRemaining?: number;
  tags?: string[];
  notes?: string;
  isTopCustomer?: boolean;
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
        perk: !!msg.perk,
        perkRemaining: msg.perkRemaining,
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

      // Fetch merchant-side tags/notes for this customer (not exposed to the
      // customer's browser, so we hydrate after the modal opens).
      if (msg.customerId) {
        fetch(`/api/customers/${msg.customerId}/notes`)
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => {
            if (!data) return;
            setCurrentRequest((curr) =>
              curr && curr.requestId === msg.requestId
                ? {
                    ...curr,
                    tags: data.tags || [],
                    notes: data.notes || "",
                    isTopCustomer: !!data.isTopCustomer,
                  }
                : curr
            );
          })
          .catch(() => {});
      }
    });

    // Customer closed their tab / navigated away before we acted — drop the
    // modal so the attendant isn't left staring at a stale request.
    const unsubCancel = on("stamp-request:cancelled-by-customer", (msg: any) => {
      const curr = currentRequestRef.current;
      if (!curr || curr.requestId !== msg.requestId) return;
      // Persist as rejected so the DB doesn't carry the stale pending row.
      fetch(`/api/stamp-request/${curr.requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      }).catch(() => {});
      toast.message("Customer left before approval", {
        description: curr.customerName,
      });
      setCurrentRequest(null);
    });

    return () => {
      unsub();
      unsubCancel();
    };
  }, [on, threshold, send]);

  // Durable fallback for the live WebSocket: pull any fresh pending request
  // straight from the DB. The WS frame can be missed if the merchant tab was
  // idle, mid-reconnect, or hadn't re-registered after a redeploy — in which
  // case the customer is stuck "waiting" and the merchant sees nothing until a
  // refresh. This makes Mongo the source of truth instead.
  const reconcile = useCallback(async () => {
    // Don't disturb a modal that's already open.
    if (currentRequestRef.current) return;
    try {
      const res = await fetch("/api/stamp-request");
      if (!res.ok) return;
      const data = await res.json();
      const reqs: StampRequestData[] = data.requests || [];
      if (reqs.length === 0 || currentRequestRef.current) return;
      const latest = reqs[0];
      setCurrentRequest(latest);
      if (latest.customerId) {
        fetch(`/api/customers/${latest.customerId}/notes`)
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => {
            if (!d) return;
            setCurrentRequest((curr) =>
              curr && curr.requestId === latest.requestId
                ? {
                    ...curr,
                    tags: d.tags || [],
                    notes: d.notes || "",
                    isTopCustomer: !!d.isTopCustomer,
                  }
                : curr
            );
          })
          .catch(() => {});
      }
    } catch {
      // network blip — the poll will retry
    }
  }, []);

  // Reconcile on mount and on every (re)connect (connected flips false→true).
  useEffect(() => {
    if (connected) reconcile();
  }, [connected, reconcile]);

  // Slow poll as a safety net even while nominally connected.
  useEffect(() => {
    const id = setInterval(reconcile, 8000);
    return () => clearInterval(id);
  }, [reconcile]);

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

        if (currentRequest?.perk || data.perk) {
          toast.success(`${name} — free reward approved`);
        } else {
          const parts: string[] = [];
          if (stampsAwarded > 0) {
            parts.push(`+${stampsAwarded} stamp${stampsAwarded > 1 ? "s" : ""} awarded`);
          }
          if (redeem) {
            parts.push("reward redeemed");
          }
          parts.push(`(${data.stampCard.stamps}/${threshold} stamps)`);
          toast.success(`${name} — ${parts.join(", ")}`);
        }
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
