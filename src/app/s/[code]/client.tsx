"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useWebSocket } from "@/lib/websocket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Coffee, Gift, Stamp, ArrowRightLeft, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import CustomerWaiting from "@/components/customer-waiting";
import StampDisplay from "@/components/stamp-display";
import { getColorHex } from "@/lib/tailwind-colors";
import { getPatternCSS } from "@/lib/patterns";

interface OtherShop {
  name: string;
  code: string;
  logo: string | null;
  stamps: number;
  threshold: number;
}

interface Props {
  shopCode: string;
  shopName: string;
  shopLogo: string | null;
  shopId: string;
  customerId: string;
  customerName: string | null;
  customerEmail: string | null;
  stamps: number;
  totalEarned: number;
  freeRedeemed: number;
  threshold: number;
  bgColor: string;
  fgColor: string;
  bgPattern: string;
  animalName: string;
  otherShops: OtherShop[];
}

type Status = "idle" | "choosing" | "requesting" | "waiting" | "approved" | "rejected";

export default function CustomerClient({
  shopCode,
  shopName,
  shopLogo,
  shopId,
  customerId,
  customerName,
  customerEmail,
  stamps: initialStamps,
  totalEarned: initialTotal,
  freeRedeemed: initialRedeemed,
  threshold,
  bgColor,
  fgColor,
  bgPattern,
  animalName,
  otherShops,
}: Props) {
  const bgHex = getColorHex(bgColor);
  const fgHex = getColorHex(fgColor);
  const [status, setStatus] = useState<Status>("idle");
  const [stamps, setStamps] = useState(initialStamps);
  const [totalEarned, setTotalEarned] = useState(initialTotal);
  const [freeRedeemed, setFreeRedeemed] = useState(initialRedeemed);
  const [stampsAwarded, setStampsAwarded] = useState(0);
  const [freedEarned, setFreedEarned] = useState(false);
  const [wasRedeemed, setWasRedeemed] = useState(false);
  const [name, setName] = useState(customerName || "");
  const [email, setEmail] = useState(customerEmail || "");
  const [showDetailsPrompt, setShowDetailsPrompt] = useState(false);
  const [showShopSwitcher, setShowShopSwitcher] = useState(false);

  const { connected, send, on } = useWebSocket(shopCode, "customer", customerId);
  const autoRequestedRef = useRef(false);

  useEffect(() => {
    const unsub1 = on("stamp-request:approved", (msg: any) => {
      const awarded = msg.stampsAwarded || 0;
      const redeemed = !!msg.redeemed;
      const earnedFree = msg.newFreeRedeemed > freeRedeemed;

      setStampsAwarded(awarded);
      setStamps(msg.newStamps);
      setTotalEarned(msg.newTotalEarned);
      setWasRedeemed(redeemed);
      if (earnedFree) {
        setFreedEarned(true);
        setFreeRedeemed(msg.newFreeRedeemed);
      }

      // Show toast instead of celebration rectangle
      if (redeemed) {
        toast.success("You earned a free drink!", {
          description: awarded > 0 ? `+${awarded} stamp${awarded > 1 ? "s" : ""} added too` : undefined,
        });
      } else if (earnedFree) {
        toast.success(`+${awarded} stamp${awarded > 1 ? "s" : ""}!`, {
          description: "You earned a free drink!",
        });
      } else if (awarded > 0) {
        toast.success(`+${awarded} stamp${awarded > 1 ? "s" : ""}!`);
      }

      if (!customerName || !customerEmail) {
        setShowDetailsPrompt(true);
        setStatus("approved");
      } else {
        setStatus("idle");
      }
    });

    const unsub2 = on("stamp-request:rejected", () => {
      toast.error("Request declined", { description: "Please ask staff for help." });
      setStatus("idle");
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [on, customerName, customerEmail, freeRedeemed]);

  const requestStamp = useCallback(async (redeem = false) => {
    setStatus("requesting");
    try {
      const res = await fetch("/api/stamp-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, customerId, redeem }),
      });

      if (!res.ok) {
        setStatus("idle");
        return;
      }

      const data = await res.json();

      send({
        type: "stamp-request:new",
        requestId: data.request._id,
        customerId,
        customerName: name || customerName || animalName,
        stamps,
        threshold,
        redeem,
      });

      setStatus("waiting");
    } catch {
      setStatus("idle");
    }
  }, [shopId, customerId, name, customerName, animalName, stamps, threshold, send]);

  // Timeout after 3 minutes of waiting
  useEffect(() => {
    if (status !== "waiting") return;
    const timer = setTimeout(() => {
      toast.error("Request timed out", { description: "Please try again." });
      setStatus("idle");
    }, 3 * 60 * 1000);
    return () => clearTimeout(timer);
  }, [status]);

  // Auto-request stamp on page load once connected
  // If customer has enough stamps for a free drink, show choice first
  useEffect(() => {
    if (connected && !autoRequestedRef.current && status === "idle") {
      autoRequestedRef.current = true;
      if (stamps >= threshold) {
        setStatus("choosing");
      } else {
        requestStamp();
      }
    }
  }, [connected, status, requestStamp, stamps, threshold]);

  async function saveDetails() {
    const update: any = {};
    if (name.trim()) update.name = name.trim();
    if (email.trim()) update.email = email.trim();
    if (Object.keys(update).length > 0) {
      await fetch(`/api/customers/${customerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
    }
    setShowDetailsPrompt(false);
    setStatus("idle");
    setFreedEarned(false);
  }

  const patternCSS = getPatternCSS(bgPattern, fgHex, 0.05);
  const displayName = name || customerName || animalName;
  const remaining = threshold - stamps;

  return (
    <div
      className="relative flex min-h-screen flex-col items-center p-4 pt-4 md:justify-center"
      style={{ backgroundColor: bgHex }}
    >
      {/* Background pattern */}
      {patternCSS && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: patternCSS }}
        />
      )}

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm space-y-6">
        {/* Shop header */}
        <div className="space-y-3">
          {shopLogo ? (
            <img
              src={shopLogo}
              alt={shopName}
              className="aspect-[3/1] w-full rounded-2xl object-cover shadow-lg"
            />
          ) : (
            <div
              className="flex aspect-[3/1] w-full items-center justify-center rounded-2xl shadow-lg"
              style={{ backgroundColor: fgHex }}
            >
              <Coffee className="h-9 w-9 text-white" />
            </div>
          )}
          <div className="flex items-baseline gap-2">
            <h1 className="text-2xl font-bold" style={{ color: fgHex }}>{shopName}</h1>
            <p className="text-sm" style={{ color: fgHex, opacity: 0.7 }}>Loyalty Card</p>
          </div>
        </div>

        {/* Stamp card */}
        <div className="rounded-2xl p-6" style={{ backgroundColor: fgHex + "38", border: `1px solid ${fgHex}50` }}>
          <StampDisplay stamps={stamps} threshold={threshold} fgColor={fgHex} animate={status === "approved"} />

          {/* Personalized progress */}
          {remaining > 0 && displayName ? (
            <p className="mt-3 text-center text-xs" style={{ color: fgHex, opacity: 0.6 }}>
              {displayName}, you&apos;re {remaining} drink{remaining > 1 ? "s" : ""} away from a free one!
            </p>
          ) : remaining > 0 ? (
            <p className="mt-3 text-center text-xs" style={{ color: fgHex, opacity: 0.5 }}>
              Buy {threshold} drinks to earn 1 free
            </p>
          ) : null}

          <p className="mt-1 text-center text-xs" style={{ color: fgHex, opacity: 0.35 }}>
            {totalEarned} stamps earned &middot; {freeRedeemed} free drinks redeemed
          </p>
        </div>

        {/* Actions */}
        <div>
          {status === "idle" && (
            <Button
              onClick={() => {
                if (stamps >= threshold) {
                  setStatus("choosing");
                } else {
                  requestStamp();
                }
              }}
              className="w-full cursor-pointer text-base font-normal hover:opacity-90"
              size="lg"
              disabled={!connected}
              style={{ backgroundColor: fgHex, color: bgHex }}
            >
              {connected ? "Request Stamp" : "Connecting..."}
            </Button>
          )}

          {status === "choosing" && (
            <div className="space-y-3">
              <p className="text-center text-sm font-medium" style={{ color: fgHex }}>
                You have a free drink available!
              </p>
              <Button
                onClick={() => requestStamp(true)}
                className="w-full cursor-pointer text-base hover:opacity-90"
                style={{ backgroundColor: fgHex + "20", color: fgHex, border: `1px solid ${fgHex}40` }}
                size="lg"
              >
                <Gift className="mr-2 h-5 w-5" />
                Redeem Free Drink
              </Button>
              <Button
                onClick={() => requestStamp(false)}
                className="w-full cursor-pointer text-base hover:opacity-90"
                style={{ backgroundColor: fgHex + "20", color: fgHex, border: `1px solid ${fgHex}40` }}
                size="lg"
              >
                <Stamp className="mr-2 h-5 w-5" />
                Get Another Stamp
              </Button>
            </div>
          )}

          {status === "requesting" && (
            <Button className="w-full"
              style={{ backgroundColor: fgHex + "20", color: fgHex, border: `1px solid ${fgHex}40` }} size="lg" disabled>
              Sending request...
            </Button>
          )}

          {status === "waiting" && <CustomerWaiting fgColor={fgHex} />}

          {status === "approved" && showDetailsPrompt && (
            <div className="space-y-3">
              {!customerName && (
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  style={{ borderColor: fgHex + "30", backgroundColor: fgHex + "10", color: fgHex }}
                  className="placeholder-inherit"
                />
              )}
              {!customerEmail && (
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  style={{ borderColor: fgHex + "30", backgroundColor: fgHex + "10", color: fgHex }}
                  className="placeholder-inherit"
                />
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm" style={{ color: fgHex, opacity: 0.6 }}>
                    Save your details
                  </p>
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="cursor-pointer" style={{ color: fgHex, opacity: 0.4 }}>
                        <HelpCircle className="h-3.5 w-3.5" />
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xs">
                      <DialogHeader>
                        <DialogTitle>Why save your details?</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3 text-sm text-muted-foreground">
                        <p>
                          This is completely optional. Your information is only shared with <strong className="text-foreground">{shopName}</strong> and will never be shared with anyone else.
                        </p>
                        <p>
                          Saving your name and email makes it easier for the shop to look you up if you ever forget your phone or lose access to your stamp card.
                        </p>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              {!customerName && !customerEmail ? (
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setShowDetailsPrompt(false);
                      setStatus("idle");
                      setFreedEarned(false);
                    }}
                    variant="outline"
                    className="flex-1 cursor-pointer hover:opacity-90"
                    style={{ borderColor: fgHex + "40", color: fgHex, backgroundColor: "transparent" }}
                  >
                    Remain anonymous
                  </Button>
                  <Button
                    onClick={saveDetails}
                    className="flex-1 cursor-pointer hover:opacity-90"
                    style={{ backgroundColor: fgHex, color: bgHex }}
                  >
                    Save
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setShowDetailsPrompt(false);
                      setStatus("idle");
                      setFreedEarned(false);
                    }}
                    variant="outline"
                    className="flex-1 cursor-pointer hover:opacity-90"
                    style={{ borderColor: fgHex + "40", color: fgHex, backgroundColor: "transparent" }}
                  >
                    Done
                  </Button>
                  <Button
                    onClick={saveDetails}
                    className="flex-1 cursor-pointer hover:opacity-90"
                    style={{ backgroundColor: fgHex, color: bgHex }}
                  >
                    Save
                  </Button>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Switch shop */}
        {otherShops.length > 0 && (
          <>
            <button
              onClick={() => setShowShopSwitcher(!showShopSwitcher)}
              className="mx-auto flex cursor-pointer items-center gap-1.5 text-xs hover:opacity-80"
              style={{ color: fgHex, opacity: 0.5 }}
            >
              <ArrowRightLeft className="h-3 w-3" />
              Switch shop
            </button>

            {showShopSwitcher && (
              <div className="space-y-2">
                {otherShops.map((s) => (
                  <a
                    key={s.code}
                    href={`/s/${s.code}`}
                    className="flex items-center gap-3 rounded-xl p-3 transition-colors"
                    style={{ backgroundColor: fgHex + "10", border: `1px solid ${fgHex}20` }}
                  >
                    {s.logo ? (
                      <img
                        src={s.logo}
                        alt={s.name}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-600">
                        <Coffee className="h-5 w-5 text-white" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: fgHex }}>{s.name}</p>
                      <p className="text-xs" style={{ color: fgHex, opacity: 0.5 }}>
                        {s.stamps} / {s.threshold} stamps
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </>
        )}

        {/* Powered by */}
        <div className="flex justify-end">
          <a
            href="/"
            className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs transition-opacity hover:opacity-80"
            style={{ backgroundColor: fgHex + "15", color: fgHex, opacity: 0.5 }}
          >
            Powered by{" "}
            <span className="font-[family-name:var(--font-logo)] tracking-wide" style={{ opacity: 1 }}>
              Brewstamp
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
