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
  // Free-plan usage from the layout; null once the shop has a paid plan.
  freeStampsLeft: number | null;
  freeStampLimit: number;
  // Admin "view as": read-only. No live connection (it would replace the
  // shop's own device on the channel), no request polling, no approval modal.
  viewOnly?: boolean;
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
  freeStampsLeft,
  freeStampLimit,
  viewOnly = false,
}: Props) {
  const router = useRouter();
  const [currentRequest, setCurrentRequest] = useState<StampRequestData | null>(
    null,
  );
  // Set when the server refuses an approval with LIMIT_REACHED — the layout's
  // count can lag by a request or two, so this forces the upgrade prompt.
  const [limitHit, setLimitHit] = useState(false);
  const currentRequestRef = useRef<StampRequestData | null>(null);
  const { connected, send, on } = useWebSocket(
    shopCode,
    "merchant",
    "merchant",
    !viewOnly,
  );

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
    const events = [
      "pointerdown",
      "pointermove",
      "keydown",
      "wheel",
      "touchstart",
    ];
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

  // Other parts of the dashboard (e.g. the "QR" button in Shop Setup) live in a
  // different subtree, so they ask us to open present mode via a window event.
  useEffect(() => {
    const open = () => setPresenting(true);
    window.addEventListener("bs:open-present", open);
    return () => window.removeEventListener("bs:open-present", open);
  }, []);

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

      // If there's already a pending request, cancel it. The same request can
      // arrive twice (the 8s poll opened it, then the WebSocket frame lands);
      // declining it then would decline the very request on screen.
      const prev = currentRequestRef.current;
      if (prev && prev.requestId === msg.requestId) return;
      if (prev) {
        fetch(`/api/stamp-request/${prev.requestId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "rejected" }),
        })
          .then((res) => {
            // Only tell the customer once the decline is actually saved.
            if (res.ok) {
              send({
                type: "stamp-request:rejected",
                requestId: prev.requestId,
                customerId: prev.customerId,
              });
            }
          })
          .catch(() => {});
      }

      setCurrentRequest(request);
      // Re-run the layout so the free-stamp count the modal gates on is
      // current as of this request, not the last page load.
      router.refresh();

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
                : curr,
            );
          })
          .catch(() => {});
      }
    });

    // Customer closed their tab / navigated away before we acted — drop the
    // modal so the attendant isn't left staring at a stale request.
    const unsubCancel = on(
      "stamp-request:cancelled-by-customer",
      (msg: any) => {
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
      },
    );

    return () => {
      unsub();
      unsubCancel();
    };
  }, [on, threshold, send, router]);

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
                : curr,
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
    if (viewOnly) return;
    const id = setInterval(reconcile, 8000);
    return () => clearInterval(id);
  }, [reconcile, viewOnly]);

  // One PATCH per request at a time: a double tap on a slow connection used
  // to send two (the second always failing as "already processed").
  const inFlight = useRef<Set<string>>(new Set());

  // The server answers GONE (expired and deleted) or ALREADY_PROCESSED (a
  // double tap, another device, or an auto-decline got there first). Neither
  // can be retried, so close the request instead of leaving staff tapping a
  // button that can only fail.
  const closeIfStale = useCallback((requestId: string, status: number, err: { code?: string; error?: string; currentStatus?: string }) => {
    if (status !== 404 && status !== 409) return false;
    if (err.code !== "GONE" && err.code !== "ALREADY_PROCESSED") return false;
    toast.message(err.error || "That request is no longer waiting.");
    setCurrentRequest((curr) => (curr && curr.requestId === requestId ? null : curr));
    setLimitHit(false);
    return true;
  }, []);

  // Requests expire 10 minutes after they're made. A tablet left on the
  // dashboard would otherwise keep showing one indefinitely.
  useEffect(() => {
    if (!currentRequest) return;
    const id = currentRequest.requestId;
    const t = setTimeout(() => {
      const curr = currentRequestRef.current;
      if (!curr || curr.requestId !== id) return;
      toast.message("Stamp request expired", { description: curr.customerName });
      setCurrentRequest(null);
      setLimitHit(false);
    }, 10 * 60 * 1000);
    return () => clearTimeout(t);
  }, [currentRequest?.requestId]); // eslint-disable-line react-hooks/exhaustive-deps

  const approve = useCallback(
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
            parts.push(
              `+${stampsAwarded} stamp${stampsAwarded > 1 ? "s" : ""} awarded`,
            );
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
      } else {
        const err = await res.json().catch(() => ({}));
        if (err.code === "LIMIT_REACHED") {
          // Keep the request open and swap to the upgrade prompt.
          setLimitHit(true);
          router.refresh();
          return;
        }
        if (closeIfStale(requestId, res.status, err)) return;
        toast.error(err.error || "Could not approve the request");
      }

      setCurrentRequest(null);
      setLimitHit(false);
    },
    [currentRequest, send, router, threshold, closeIfStale],
  );

  const handleApprove = useCallback(
    async (requestId: string, stampsAwarded: number, redeem: boolean) => {
      if (inFlight.current.has(requestId)) return;
      inFlight.current.add(requestId);
      try {
        await approve(requestId, stampsAwarded, redeem);
      } finally {
        inFlight.current.delete(requestId);
      }
    },
    [approve],
  );

  const handleReject = useCallback(
    async (requestId: string) => {
      if (inFlight.current.has(requestId)) return;
      inFlight.current.add(requestId);
      const res = await fetch(`/api/stamp-request/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      })
        .catch(() => null)
        .finally(() => inFlight.current.delete(requestId));

      // If the decline wasn't saved, say so and keep the request open —
      // telling the customer "declined" while it's still pending (and will
      // pop up again on the next poll) is the worst of both. Unless it can
      // never be saved: expired or already handled closes it.
      if (!res?.ok) {
        const err = res ? await res.json().catch(() => ({})) : {};
        if (res && closeIfStale(requestId, res.status, err)) return;
        toast.error("Couldn't decline that request. Try again.");
        return;
      }

      send({
        type: "stamp-request:rejected",
        requestId,
        customerId: currentRequest?.customerId,
      });

      setCurrentRequest(null);
    },
    [currentRequest, send, closeIfStale],
  );

  return (
    <>
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${viewOnly ? "bg-muted-foreground/50" : connected ? "bg-green-500" : "bg-red-500"}`}
        />
        <span className="text-sm text-muted-foreground">
          {viewOnly ? "View only" : connected ? "Live" : "Disconnected"}
        </span>
      </div>

      {/* Zero-print onboarding path: flip the screen and let the customer scan. */}
      <Button
        size="sm"
        onClick={enterPresent}
        className="cursor-pointer gap-1.5 bg-amber-700 text-white hover:bg-amber-800"
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

      {!viewOnly && (
        <StampRequestModal
          request={currentRequest}
          onApprove={handleApprove}
          onReject={(id) => {
            setLimitHit(false);
            handleReject(id);
          }}
          freeStampsLeft={limitHit ? 0 : freeStampsLeft}
          freeStampLimit={freeStampLimit}
        />
      )}
    </>
  );
}
