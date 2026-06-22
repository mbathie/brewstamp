"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useWebSocket } from "@/lib/websocket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Coffee,
  Gift,
  Stamp,
  ArrowRightLeft,
  HelpCircle,
  LogIn,
  Pencil,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import CustomerWaiting from "@/components/customer-waiting";
import CardPreview from "@/components/card-preview";
import { AddToWallet } from "@/components/add-to-wallet";
import { getColorHex, surfaceStyle } from "@/lib/tailwind-colors";
import { resolveLanguage, t } from "@/lib/i18n";

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
  language?: string;
  animalName: string;
  otherShops: OtherShop[];
  walletGoogle: boolean;
  walletApple: boolean;
}

type Status =
  | "idle"
  | "choosing"
  | "requesting"
  | "waiting"
  | "approved"
  | "rejected";

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
  language,
  animalName,
  otherShops,
  walletGoogle,
  walletApple,
}: Props) {
  const bgHex = getColorHex(bgColor);
  const fgHex = getColorHex(fgColor);
  const lang = resolveLanguage(language);
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
  const [showLogin, setShowLogin] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [view, setView] = useState<"card" | "edit" | "switch">("card");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");
  // Set true when the customer fills in their details inline (so we can flip
  // the UI from "anonymous" to "signed in" without reloading the page — the
  // customerName prop comes from the server and stays stale until next visit).
  const [accountCreated, setAccountCreated] = useState(false);
  const hasAccount = !!customerName || accountCreated;

  const searchParams = useSearchParams();
  const viewOnly = searchParams.get("checkin") === "0";

  const { connected, send, on } = useWebSocket(
    shopCode,
    "customer",
    customerId,
  );
  const autoRequestedRef = useRef(false);
  const pendingRequestIdRef = useRef<string | null>(null);
  // Guards against double-applying a resolution when both the live WebSocket
  // frame AND the status poll deliver the same result for one request.
  const handledRef = useRef<string | null>(null);

  // Apply an approval from either source (WS push or status poll). Values are
  // absolute (newStamps, etc.) so a duplicate call is harmless, but the
  // handledRef guard keeps the toast from firing twice.
  const applyApproval = useCallback(
    (
      reqId: string,
      p: {
        stampsAwarded: number;
        redeemed: boolean;
        newStamps: number;
        newTotalEarned: number;
        newFreeRedeemed: number;
      },
    ) => {
      if (reqId && handledRef.current === reqId) return;
      handledRef.current = reqId;

      const awarded = p.stampsAwarded || 0;
      const redeemed = !!p.redeemed;
      const earnedFree = p.newFreeRedeemed > freeRedeemed;

      setStampsAwarded(awarded);
      setStamps(p.newStamps);
      setTotalEarned(p.newTotalEarned);
      setWasRedeemed(redeemed);
      if (earnedFree) {
        setFreedEarned(true);
        setFreeRedeemed(p.newFreeRedeemed);
      }

      if (redeemed) {
        toast.success("You earned a reward!", {
          description:
            awarded > 0
              ? `+${awarded} stamp${awarded > 1 ? "s" : ""} added too`
              : undefined,
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
    },
    [freeRedeemed, detailsSaved, customerName, customerEmail],
  );

  const applyRejection = useCallback((reqId: string | null) => {
    if (reqId && handledRef.current === reqId) return;
    if (reqId) handledRef.current = reqId;
    toast.error("Request declined");
    setStatus("idle");
  }, []);

  useEffect(() => {
    const unsub1 = on("stamp-request:approved", (msg: any) => {
      applyApproval(msg.requestId, {
        stampsAwarded: msg.stampsAwarded,
        redeemed: msg.redeemed,
        newStamps: msg.newStamps,
        newTotalEarned: msg.newTotalEarned,
        newFreeRedeemed: msg.newFreeRedeemed,
      });
    });

    const unsub2 = on("stamp-request:rejected", (msg: any) => {
      applyRejection(msg?.requestId ?? null);
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [on, applyApproval, applyRejection]);

  // Fallback for a dropped approval frame: while waiting, poll the request's
  // status so the customer still sees the result even if the WebSocket missed
  // the merchant's response (idle tab, reconnect, redeploy).
  useEffect(() => {
    if (status !== "waiting") return;
    const reqId = pendingRequestIdRef.current;
    if (!reqId) return;
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/stamp-request/${reqId}`);
        if (!res.ok) return;
        const d = await res.json();
        if (d.status === "approved" && d.stampCard) {
          applyApproval(reqId, {
            stampsAwarded: d.stampsAwarded,
            redeemed: d.redeemed,
            newStamps: d.stampCard.stamps,
            newTotalEarned: d.stampCard.totalEarned,
            newFreeRedeemed: d.stampCard.freeRedeemed,
          });
        } else if (d.status === "rejected" || d.status === "expired") {
          applyRejection(reqId);
        }
      } catch {
        // transient — keep polling
      }
    }, 3000);
    return () => clearInterval(id);
  }, [status, applyApproval, applyRejection]);

  const requestStamp = useCallback(
    async (redeem = false) => {
      setStatus("requesting");
      try {
        const res = await fetch("/api/stamp-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shopId, customerId, redeem }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          if (err.code === "CUSTOMER_DISABLED") {
            toast.error("Your account has been disabled.");
          }
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

        pendingRequestIdRef.current = data.request._id;
        setStatus("waiting");
      } catch {
        setStatus("idle");
      }
    },
    [
      shopId,
      customerId,
      name,
      customerName,
      animalName,
      stamps,
      threshold,
      send,
    ],
  );

  // Tell the merchant if the customer closes / navigates away while waiting,
  // so they aren't stuck staring at a stamp-request modal that will never
  // resolve. We use pagehide rather than beforeunload because it fires for
  // mobile Safari tab-switch + back-forward navigation as well.
  useEffect(() => {
    function cancelPending() {
      const reqId = pendingRequestIdRef.current;
      if (!reqId) return;
      pendingRequestIdRef.current = null;
      send({
        type: "stamp-request:cancelled-by-customer",
        requestId: reqId,
        customerId,
      });
    }
    window.addEventListener("pagehide", cancelPending);
    return () => {
      window.removeEventListener("pagehide", cancelPending);
    };
  }, [send, customerId]);

  // When a request resolves, clear the pending marker so a future close
  // doesn't try to cancel a request that's already been actioned.
  useEffect(() => {
    if (status === "idle" || status === "approved" || status === "rejected") {
      pendingRequestIdRef.current = null;
    }
  }, [status]);

  // Timeout after 3 minutes of waiting
  useEffect(() => {
    if (status !== "waiting") return;
    const timer = setTimeout(
      () => {
        toast.error("Request timed out", { description: "Please try again." });
        setStatus("idle");
      },
      3 * 60 * 1000,
    );
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
      if (update.name) setAccountCreated(true);
    }
    setDetailsSaved(true);
    setShowDetailsPrompt(false);
    setStatus("idle");
    setFreedEarned(false);
  }

  async function saveEditedDetails() {
    setEditError("");
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEditError(t(lang, "invalidEmail"));
      return;
    }
    setEditSaving(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const update: any = {};
      if (name.trim()) update.name = name.trim();
      if (email.trim()) update.email = email.trim();
      if (password.trim()) update.password = password.trim();
      const res = await fetch(`/api/customers/${customerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
      if (!res.ok) throw new Error("save-failed");
      setPassword("");
      toast.success(t(lang, "detailsUpdated"));
      setView("card");
    } catch {
      setEditError(t(lang, "couldNotSave"));
    } finally {
      setEditSaving(false);
    }
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

  const displayName = name || customerName || animalName;

  return (
    <CardPreview
      shopName={shopName}
      shopLogo={shopLogo}
      stamps={stamps}
      threshold={threshold}
      totalEarned={totalEarned}
      freeRedeemed={freeRedeemed}
      bgColor={bgColor}
      fgColor={fgColor}
      bgPattern={bgPattern}
      displayName={displayName}
      animate={status === "approved"}
      language={lang}
      showAltFace={view !== "card"}
      altFace={
        view === "switch" ? (
          <div
            className="space-y-3 rounded-2xl p-5"
            style={surfaceStyle(bgHex, fgHex)}
          >
            <p
              className="text-center text-base font-semibold"
              style={{ color: fgHex }}
            >
              {t(lang, "switchShop")}
            </p>
            <div className="space-y-2">
              {/* Current shop — highlighted, not a link */}
              <div
                className="flex items-center gap-3 rounded-xl p-3"
                style={{
                  backgroundColor: fgHex + "1f",
                  border: `1px solid ${fgHex}66`,
                }}
              >
                {shopLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={shopLogo}
                    alt={shopName}
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                ) : (
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{ backgroundColor: fgHex }}
                  >
                    <Coffee className="h-5 w-5" style={{ color: bgHex }} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-sm font-medium"
                    style={{ color: fgHex }}
                  >
                    {shopName}
                  </p>
                  <p className="text-xs" style={{ color: fgHex, opacity: 0.6 }}>
                    {stamps} / {threshold} stamps
                  </p>
                </div>
                <div
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: fgHex, color: bgHex }}
                  aria-label="Current shop"
                >
                  <Check className="h-4 w-4" />
                </div>
              </div>
              {otherShops.map((s) => (
                <a
                  key={s.code}
                  href={`/s/${s.code}`}
                  className="flex items-center gap-3 rounded-xl p-3 transition-opacity hover:opacity-80"
                  style={{
                    backgroundColor: fgHex + "10",
                    border: `1px solid ${fgHex}25`,
                  }}
                >
                  {s.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.logo}
                      alt={s.name}
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg"
                      style={{ backgroundColor: fgHex }}
                    >
                      <Coffee className="h-5 w-5" style={{ color: bgHex }} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-sm font-medium"
                      style={{ color: fgHex }}
                    >
                      {s.name}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: fgHex, opacity: 0.6 }}
                    >
                      {s.stamps} / {s.threshold} stamps
                    </p>
                  </div>
                </a>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setView("card")}
              className="w-full cursor-pointer hover:opacity-90"
              style={{
                borderColor: fgHex + "40",
                color: fgHex,
                backgroundColor: "transparent",
              }}
            >
              {t(lang, "back")}
            </Button>
          </div>
        ) : (
          <div
            className="space-y-3 rounded-2xl p-5"
            style={surfaceStyle(bgHex, fgHex)}
          >
            <div className="space-y-1.5">
              <Label className="text-xs" style={{ color: fgHex, opacity: 0.7 }}>
                {t(lang, "yourName")}
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t(lang, "yourName")}
                style={{
                  borderColor: fgHex + "30",
                  backgroundColor: fgHex + "10",
                  color: fgHex,
                }}
                className="placeholder-inherit"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" style={{ color: fgHex, opacity: 0.7 }}>
                {t(lang, "yourEmail")}
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEditError("");
                }}
                placeholder={t(lang, "yourEmail")}
                style={{
                  borderColor: fgHex + "30",
                  backgroundColor: fgHex + "10",
                  color: fgHex,
                }}
                className="placeholder-inherit"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" style={{ color: fgHex, opacity: 0.7 }}>
                {t(lang, "setPassword")}
              </Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  borderColor: fgHex + "30",
                  backgroundColor: fgHex + "10",
                  color: fgHex,
                }}
                className="placeholder-inherit"
              />
            </div>
            {editError && <p className="text-xs text-red-400">{editError}</p>}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setView("card");
                  setEditError("");
                  setPassword("");
                }}
                className="flex-1 cursor-pointer hover:opacity-90"
                style={{
                  borderColor: fgHex + "40",
                  color: fgHex,
                  backgroundColor: "transparent",
                }}
              >
                {t(lang, "cancel")}
              </Button>
              <Button
                type="button"
                onClick={saveEditedDetails}
                disabled={editSaving}
                className="flex-1 cursor-pointer hover:opacity-90"
                style={{ backgroundColor: fgHex, color: bgHex }}
              >
                {editSaving ? t(lang, "saving") : t(lang, "saveChanges")}
              </Button>
            </div>
          </div>
        )
      }
    >
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
            {connected ? t(lang, "requestStamp") : t(lang, "connecting")}
          </Button>
        )}

        {status === "choosing" && (
          <div className="space-y-3">
            <p
              className="text-center text-sm font-medium"
              style={{ color: fgHex }}
            >
              {t(lang, "rewardAvailable")}
            </p>
            <Button
              onClick={() => requestStamp(true)}
              className="w-full cursor-pointer text-base hover:opacity-90"
              style={{
                backgroundColor: fgHex + "20",
                color: fgHex,
                border: `1px solid ${fgHex}40`,
              }}
              size="lg"
            >
              <Gift className="mr-2 h-5 w-5" />
              {t(lang, "redeemReward")}
            </Button>
            <Button
              onClick={() => requestStamp(false)}
              className="w-full cursor-pointer text-base hover:opacity-90"
              style={{
                backgroundColor: fgHex + "20",
                color: fgHex,
                border: `1px solid ${fgHex}40`,
              }}
              size="lg"
            >
              <Stamp className="mr-2 h-5 w-5" />
              {t(lang, "getAnotherStamp")}
            </Button>
          </div>
        )}

        {status === "requesting" && (
          <Button
            className="w-full"
            style={{
              backgroundColor: fgHex + "20",
              color: fgHex,
              border: `1px solid ${fgHex}40`,
            }}
            size="lg"
            disabled
          >
            {t(lang, "sendingRequest")}
          </Button>
        )}

        {status === "waiting" && (
          <CustomerWaiting fgColor={fgHex} language={lang} />
        )}

        {status === "approved" && showDetailsPrompt && (
          <div className="space-y-3">
            {!customerName && (
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t(lang, "yourName")}
                style={{
                  borderColor: fgHex + "30",
                  backgroundColor: fgHex + "10",
                  color: fgHex,
                }}
                className="placeholder-inherit"
              />
            )}
            {!customerEmail && (
              <div>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError("");
                  }}
                  placeholder={t(lang, "yourEmail")}
                  style={{
                    borderColor: emailError ? undefined : fgHex + "30",
                    backgroundColor: fgHex + "10",
                    color: fgHex,
                  }}
                  className={`placeholder-inherit ${emailError ? "border-red-400" : ""}`}
                />
                {emailError && (
                  <p className="mt-1 text-xs text-red-400">{emailError}</p>
                )}
              </div>
            )}
            {!customerHasPassword && (
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t(lang, "setPassword")}
                style={{
                  borderColor: fgHex + "30",
                  backgroundColor: fgHex + "10",
                  color: fgHex,
                }}
                className="placeholder-inherit"
              />
            )}
            <div className="flex items-center justify-between">
              <Dialog>
                <DialogTrigger asChild>
                  <button
                    className="flex cursor-pointer items-center gap-1.5"
                    type="button"
                  >
                    <p
                      className="text-sm"
                      style={{ color: fgHex, opacity: 0.6 }}
                    >
                      {t(lang, "whySaveDetails")}
                    </p>
                    <span style={{ color: fgHex, opacity: 0.4 }}>
                      <HelpCircle className="h-3.5 w-3.5" />
                    </span>
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-xs">
                  <DialogHeader>
                    <DialogTitle>{t(lang, "whySaveDetails")}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>
                      This is completely optional. Your information is only
                      shared with{" "}
                      <strong className="text-foreground">{shopName}</strong>{" "}
                      and will never be shared with anyone else.
                    </p>
                    <p>
                      Saving your name and email makes it easier for the shop to
                      look you up if you ever forget your phone or lose access
                      to your stamp card.
                    </p>
                    <p>
                      Setting a{" "}
                      <strong className="text-foreground">password</strong> lets
                      you log in from any device to access your stamps — so you
                      never lose your progress.
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
                  style={{
                    borderColor: fgHex + "40",
                    color: fgHex,
                    backgroundColor: "transparent",
                  }}
                >
                  {t(lang, "remainAnonymous")}
                </Button>
                <Button
                  onClick={saveDetails}
                  className="flex-1 cursor-pointer hover:opacity-90"
                  style={{ backgroundColor: fgHex, color: bgHex }}
                >
                  {t(lang, "save")}
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
                  style={{
                    borderColor: fgHex + "40",
                    color: fgHex,
                    backgroundColor: "transparent",
                  }}
                >
                  Done
                </Button>
                <Button
                  onClick={saveDetails}
                  className="flex-1 cursor-pointer hover:opacity-90"
                  style={{ backgroundColor: fgHex, color: bgHex }}
                >
                  {t(lang, "save")}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Login for returning customers — only show to true anonymous
            visitors. If they just created an account inline, hide it. */}
      {!hasAccount && (
        <div className="text-center">
          {!showLogin ? (
            <Button
              onClick={() => setShowLogin(true)}
              className="w-full cursor-pointer text-base font-normal hover:opacity-90"
              size="lg"
              style={{ backgroundColor: fgHex, color: bgHex }}
            >
              <LogIn className="mr-1.5 h-4 w-4" />
              {t(lang, "haveExistingAccount")}
            </Button>
          ) : (
            <div className="space-y-3">
              <Input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder={t(lang, "email")}
                style={{
                  borderColor: fgHex + "30",
                  backgroundColor: fgHex + "10",
                  color: fgHex,
                }}
                className="placeholder-inherit"
              />
              <Input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder={t(lang, "password")}
                style={{
                  borderColor: fgHex + "30",
                  backgroundColor: fgHex + "10",
                  color: fgHex,
                }}
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
                  style={{
                    borderColor: fgHex + "40",
                    color: fgHex,
                    backgroundColor: "transparent",
                  }}
                >
                  {t(lang, "cancel")}
                </Button>
                <Button
                  onClick={handleLogin}
                  disabled={loginLoading || !loginEmail || !loginPassword}
                  className="flex-1 cursor-pointer hover:opacity-90"
                  style={{ backgroundColor: fgHex, color: bgHex }}
                >
                  {loginLoading ? t(lang, "loggingIn") : t(lang, "logIn")}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add to Wallet — optional upgrade; browser card stays the default. */}
      {(walletGoogle || walletApple) && (
        <div className="mt-4">
          <AddToWallet
            shopId={shopId}
            customerId={customerId}
            google={walletGoogle}
            apple={walletApple}
          />
        </div>
      )}

      {/* Switch shop + Update details — half-width row when both are
            available, full-width otherwise. Update details only shows for
            authenticated customers (they have a name on record). */}
      {(otherShops.length > 0 || hasAccount) && (
        <div className="flex gap-2">
          {otherShops.length > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setView("switch")}
              className="flex-1 cursor-pointer hover:opacity-90"
              style={{
                borderColor: fgHex + "40",
                color: fgHex,
                backgroundColor: "transparent",
              }}
            >
              <ArrowRightLeft className="mr-1.5 h-4 w-4" />
              {t(lang, "switchShop")}
            </Button>
          )}
          {hasAccount && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setView("edit")}
              className="flex-1 cursor-pointer hover:opacity-90"
              style={{
                borderColor: fgHex + "40",
                color: fgHex,
                backgroundColor: "transparent",
              }}
            >
              <Pencil className="mr-1.5 h-4 w-4" />
              {t(lang, "updateDetails")}
            </Button>
          )}
        </div>
      )}

      {/* Powered by — sits at the natural end of the content, right-aligned
            and small. No fixed positioning so it can't overlap action buttons
            on tall pages. */}
      <div className="flex justify-end">
        <a
          href="/"
          className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs transition-opacity hover:opacity-80"
          style={{ backgroundColor: fgHex + "15", color: fgHex }}
        >
          Powered by{" "}
          <span
            className="font-[family-name:var(--font-logo)] tracking-wide"
            style={{ opacity: 1 }}
          >
            Brewstamp
          </span>
        </a>
      </div>
    </CardPreview>
  );
}
