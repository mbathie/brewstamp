"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useWebSocket } from "@/lib/websocket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Coffee, Gift, Stamp, ArrowRightLeft, HelpCircle, LogIn } from "lucide-react";
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
  customerHasPassword: boolean;
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
  customerHasPassword,
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
  const [password, setPassword] = useState("");
  const [showDetailsPrompt, setShowDetailsPrompt] = useState(false);
  const [detailsSaved, setDetailsSaved] = useState(false);
  const [showShopSwitcher, setShowShopSwitcher] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const searchParams = useSearchParams();
  const viewOnly = searchParams.get("checkin") === "0";

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
        toast.success("You earned a reward!", {
          description: awarded > 0 ? `+${awarded} stamp${awarded > 1 ? "s" : ""} added too` : undefined,
        });
      } else if (earnedFree) {
        toast.success(`+${awarded} stamp${awarded > 1 ? "s" : ""}!`, {
          description: "You earned a reward!",
        });
      } else if (awarded > 0) {
        toast.success(`+${awarded} stamp${awarded > 1 ? "s" : ""}!`);
      }

      if (!detailsSaved && (!customerName || !customerEmail)) {
        setShowDetailsPrompt(true);
        setStatus("approved");
      } else {
        setStatus("idle");
      }
    });

    const unsub2 = on("stamp-request:rejected", () => {
      toast.error("Request declined");
      setStatus("idle");
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [on, customerName, customerEmail, freeRedeemed, detailsSaved]);

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
  // Skip if ?checkin=0 (view-only mode)
  useEffect(() => {
    if (viewOnly) return;
    if (connected && !autoRequestedRef.current && status === "idle") {
      autoRequestedRef.current = true;
      if (stamps >= threshold) {
        setStatus("choosing");
      } else {
        requestStamp();
      }
    }
  }, [connected, status, requestStamp, stamps, threshold, viewOnly]);

  async function saveDetails() {
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError("Please enter a valid email address");
      return;
    }
    setEmailError("");
    const update: any = {};
    if (name.trim()) update.name = name.trim();
    if (email.trim()) update.email = email.trim();
    if (password.trim()) update.password = password.trim();
    if (Object.keys(update).length > 0) {
      await fetch(`/api/customers/${customerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
    }
    setDetailsSaved(true);
    setShowDetailsPrompt(false);
    setStatus("idle");
    setFreedEarned(false);
  }

  async function handleLogin() {
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await fetch("/api/customers/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        setLoginError(data.error || "Login failed");
        return;
      }
      window.location.reload();
    } catch {
      setLoginError("Something went wrong");
    } finally {
      setLoginLoading(false);
    }
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
        <div>
          <img
            src={shopLogo || "/default-shop-banner.jpg"}
            alt={shopName}
            className="aspect-[3/1] w-full rounded-2xl object-cover shadow-lg"
          />
        </div>

        {/* Stamp card */}
        <div className="rounded-2xl p-6" style={{ backgroundColor: fgHex + "38", border: `1px solid ${fgHex}50` }}>
          <p className="mb-4 text-center text-sm font-medium" style={{ color: fgHex }}>
            {shopName} <span style={{ opacity: 0.6 }}>&middot; Loyalty Card</span>
          </p>
          <StampDisplay stamps={stamps} threshold={threshold} fgColor={fgHex} animate={status === "approved"} />

          {/* Personalized progress */}
          {remaining > 0 && displayName ? (
            <p className="mt-3 text-center text-xs" style={{ color: fgHex }}>
              {displayName}, you&apos;re {remaining} stamp{remaining > 1 ? "s" : ""} away from a free one!
            </p>
          ) : remaining > 0 ? (
            <p className="mt-3 text-center text-xs" style={{ color: fgHex }}>
              Collect {threshold} stamps to earn 1 free
            </p>
          ) : null}

          <p className="mt-1 text-center text-xs" style={{ color: fgHex}}>
            {totalEarned} stamps earned &middot; {freeRedeemed} rewards redeemed
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
                You have a reward available!
              </p>
              <Button
                onClick={() => requestStamp(true)}
                className="w-full cursor-pointer text-base hover:opacity-90"
                style={{ backgroundColor: fgHex + "20", color: fgHex, border: `1px solid ${fgHex}40` }}
                size="lg"
              >
                <Gift className="mr-2 h-5 w-5" />
                Redeem Reward
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
                <div>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                    placeholder="Your email"
                    style={{ borderColor: emailError ? undefined : fgHex + "30", backgroundColor: fgHex + "10", color: fgHex }}
                    className={`placeholder-inherit ${emailError ? "border-red-400" : ""}`}
                  />
                  {emailError && <p className="mt-1 text-xs text-red-400">{emailError}</p>}
                </div>
              )}
              {!customerHasPassword && (
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Set a password"
                  style={{ borderColor: fgHex + "30", backgroundColor: fgHex + "10", color: fgHex }}
                  className="placeholder-inherit"
                />
              )}
              <div className="flex items-center justify-between">
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="flex cursor-pointer items-center gap-1.5" type="button">
                      <p className="text-sm" style={{ color: fgHex, opacity: 0.6 }}>
                        Why save your details?
                      </p>
                      <span style={{ color: fgHex, opacity: 0.4 }}>
                        <HelpCircle className="h-3.5 w-3.5" />
                      </span>
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
                        <p>
                          Setting a <strong className="text-foreground">password</strong> lets you log in from any device to access your stamps — so you never lose your progress.
                        </p>
                      </div>
                    </DialogContent>
                </Dialog>
              </div>
              {!customerName && !customerEmail ? (
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setDetailsSaved(true);
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

        {/* Login for returning customers */}
        {!customerName && (
          <div className="text-center">
            {!showLogin ? (
              <Button
                onClick={() => setShowLogin(true)}
                className="w-full cursor-pointer text-base font-normal hover:opacity-90"
                size="lg"
                style={{ backgroundColor: fgHex, color: bgHex }}
              >
                <LogIn className="mr-1.5 h-4 w-4" />
                Have an existing account? Log in
              </Button>
            ) : (
              <div className="space-y-3">
                <Input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="Email"
                  style={{ borderColor: fgHex + "30", backgroundColor: fgHex + "10", color: fgHex }}
                  className="placeholder-inherit"
                />
                <Input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Password"
                  style={{ borderColor: fgHex + "30", backgroundColor: fgHex + "10", color: fgHex }}
                  className="placeholder-inherit"
                />
                {loginError && (
                  <p className="text-xs text-red-400">{loginError}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowLogin(false)}
                    variant="outline"
                    className="flex-1 cursor-pointer hover:opacity-90"
                    style={{ borderColor: fgHex + "40", color: fgHex, backgroundColor: "transparent" }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleLogin}
                    disabled={loginLoading || !loginEmail || !loginPassword}
                    className="flex-1 cursor-pointer hover:opacity-90"
                    style={{ backgroundColor: fgHex, color: bgHex }}
                  >
                    {loginLoading ? "Logging in..." : "Log in"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

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
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-700">
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
            style={{ backgroundColor: fgHex + "15", color: fgHex }}
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
