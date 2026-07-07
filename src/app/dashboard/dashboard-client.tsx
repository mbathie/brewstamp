"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useWebSocket } from "@/lib/websocket";
import StampRequestModal from "@/components/stamp-request-modal";
import PresentMode, { type PresentFlash } from "@/components/present-mode";
import { Button } from "@/components/ui/button";
import { QrCode } from "lucide-react";
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
  // Branding for the full-screen "present" (counter display) view.
  shopName: string;
  shopLogo: string | null;
  perkMode: boolean;
  dailyDrinkLimit: number;
  bgColor: string;
  fgColor: string;
  bgPattern: string;
  language: string;
}

export default function DashboardClient({
  shopCode,
  shopId,
  threshold,
  shopName,
  shopLogo,
  perkMode,
  dailyDrinkLimit,
  bgColor,
  fgColor,
  bgPattern,
  language,
}: Props) {
  const router = useRouter();
  const [currentRequest, setCurrentRequest] = useState<StampRequestData | null>(null);
  const currentRequestRef = useRef<StampRequestData | null>(null);
  const { connected, send, on } = useWebSocket(shopCode, "merchant", "merchant");

  // Present ("counter display") mode. A per-device localStorage flag lets a
  // dedicated counter tablet boot straight into it while the owner's laptop
  // still opens to the dashboard. `flash` shows the 1.5s ✓ after an approval.
  const PRESENT_KEY = `bs_present_default:${shopId}`;
  const [presenting, setPresenting] = useState(false);
  const [isDefault, setIsDefault] = useState(false);
  const [flash, setFlash] = useState<PresentFlash | null>(null);
  const presentingRef = useRef(false);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    presentingRef.current = presenting;
  }, [presenting]);

  // Restore the per-device preference on mount.
  useEffect(() => {
    try {
      if (localStorage.getItem(PRESENT_KEY) === "1") {
        setIsDefault(true);
        setPresenting(true);
      }
    } catch {
      /* private mode / no storage */
    }
    return () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function enterPresent() {
    // Stays contained in the browser window (the overlay is fixed inset-0) —
    // no OS fullscreen. Staff can opt into true fullscreen via the button
    // inside the overlay if they want a dedicated kiosk.
    setPresenting(true);
  }

  function exitPresent() {
    setPresenting(false);
    setFlash(null);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  }

  // Kiosk return-to-QR: when "always show on this device" is on and the merchant
  // has exited to do admin, bring the QR back once the device is genuinely
  // unattended. Any interaction resets the timer, so active use never gets
  // yanked back — it only returns when someone walks away from the counter.
  const IDLE_RETURN_MS = 90_000;
  useEffect(() => {
    if (!isDefault || presenting) return;
    let timer: ReturnType<typeof setTimeout>;
    const arm = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setPresenting(true), IDLE_RETURN_MS);
    };
    const events = ["pointerdown", "pointermove", "keydown", "wheel", "touchstart"];
    events.forEach((e) => window.addEventListener(e, arm, { passive: true }));
    arm();
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, arm));
    };
  }, [isDefault, presenting]);

  function toggleDefault() {
    setIsDefault((prev) => {
      const next = !prev;
      try {
        if (next) localStorage.setItem(PRESENT_KEY, "1");
        else localStorage.removeItem(PRESENT_KEY);
      } catch {
        /* ignore */
      }
      return next;
    });
  }

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

        const isPerk = !!(currentRequest?.perk || data.perk);
        if (isPerk) {
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

        // In present mode, flash a ✓ confirmation over the QR for staff, then
        // fall back to the QR for the next customer.
        if (presentingRef.current) {
          if (flashTimer.current) clearTimeout(flashTimer.current);
          setFlash({
            name,
            stamps: data.stampCard.stamps,
            threshold,
            redeemed: !!redeem,
            perk: isPerk,
          });
          flashTimer.current = setTimeout(() => setFlash(null), 1500);
        }
      }

      setCurrentRequest(null);
    },
    [currentRequest, send, router, threshold]
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

      {/* Zero-print onboarding path: flip the screen and let the customer scan. */}
      <Button
        variant="outline"
        size="sm"
        onClick={enterPresent}
        className="cursor-pointer gap-1.5"
        title="Show a full-screen QR to flip toward your customer"
      >
        <QrCode className="size-4" />
        <span className="hidden sm:inline">Show QR</span>
      </Button>

      {presenting && (
        <PresentMode
          shopCode={shopCode}
          shopName={shopName}
          shopLogo={shopLogo}
          threshold={threshold}
          perkMode={perkMode}
          dailyDrinkLimit={dailyDrinkLimit}
          bgColor={bgColor}
          fgColor={fgColor}
          bgPattern={bgPattern}
          language={language}
          connected={connected}
          flash={flash}
          isDefault={isDefault}
          onToggleDefault={toggleDefault}
          onExit={exitPresent}
        />
      )}

      <StampRequestModal
        request={currentRequest}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </>
  );
}
