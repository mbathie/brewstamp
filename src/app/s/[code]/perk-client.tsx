"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useWebSocket } from "@/lib/websocket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Coffee, Check, Pencil } from "lucide-react";
import { toast } from "sonner";
import { getColorHex, surfaceStyle } from "@/lib/tailwind-colors";
import { getPatternCSS } from "@/lib/patterns";
import { emailDomainAllowed } from "@/lib/perk-domain";
import CustomerWaiting from "@/components/customer-waiting";
import { AddToWallet } from "@/components/add-to-wallet";

interface Props {
  shopCode: string;
  shopName: string;
  shopLogo: string | null;
  shopId: string;
  customerId: string;
  customerEmail: string | null;
  customerName: string | null;
  emailAllowed: boolean;
  emailVerified: boolean;
  allowedDomains: string[];
  dailyLimit: number;
  drinksToday: number;
  bgColor: string;
  fgColor: string;
  bgPattern: string;
  walletGoogle: boolean;
  walletApple: boolean;
}

type Status = "idle" | "requesting" | "waiting";
type VerifyStep = "email" | "code" | "done";

export default function PerkCustomerClient({
  shopCode,
  shopName,
  shopLogo,
  shopId,
  customerId,
  customerEmail,
  customerName,
  emailAllowed: initialEmailAllowed,
  emailVerified: initialEmailVerified,
  allowedDomains,
  dailyLimit,
  drinksToday: initialDrinksToday,
  bgColor,
  fgColor,
  bgPattern,
  walletGoogle,
  walletApple,
}: Props) {
  const bgHex = getColorHex(bgColor);
  const fgHex = getColorHex(fgColor);
  const patternCSS = getPatternCSS(bgPattern, fgHex, 0.05);

  // Three-step gate: enter work email → enter the emailed 6-digit code → done.
  // "done" means domain-allowed AND mailbox-verified, the only state that can
  // claim a coffee.
  const [step, setStep] = useState<VerifyStep>(
    initialEmailAllowed && initialEmailVerified ? "done" : "email",
  );
  const [email, setEmail] = useState(customerEmail || "");
  const [emailError, setEmailError] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  // Code-entry step.
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [resending, setResending] = useState(false);

  const [drinksToday, setDrinksToday] = useState(initialDrinksToday);
  const [status, setStatus] = useState<Status>("idle");

  // "Your details" panel.
  const [showDetails, setShowDetails] = useState(false);
  const [name, setName] = useState(customerName || "");
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  const remaining = Math.max(0, dailyLimit - drinksToday);
  const atLimit = remaining <= 0;
  // The email is the identity the daily cap is counted against, so it's locked
  // for editing once they've claimed a coffee today — it frees up at the same
  // daily reset as the drink limit. Name stays editable.
  const emailEditable = drinksToday <= 0;

  const { connected, send, on } = useWebSocket(
    shopCode,
    "customer",
    customerId,
  );
  const autoRequestedRef = useRef(false);
  const pendingRequestIdRef = useRef<string | null>(null);

  const requestDrink = useCallback(async () => {
    setStatus("requesting");
    try {
      const res = await fetch("/api/stamp-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, customerId, redeem: true }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.code === "DAILY_LIMIT_REACHED") {
          setDrinksToday(dailyLimit);
          toast.error(data.error || "Daily limit reached.");
        } else if (data.code === "DOMAIN_NOT_ALLOWED") {
          setStep("email");
          toast.error("Please enter your work email.");
        } else if (data.code === "EMAIL_NOT_VERIFIED") {
          setStep("email");
          toast.error("Please verify your work email.");
        } else if (data.code === "CUSTOMER_DISABLED") {
          toast.error("Your account has been disabled.");
        } else {
          toast.error("Something went wrong. Try again.");
        }
        setStatus("idle");
        return;
      }
      const data = await res.json();
      send({
        type: "stamp-request:new",
        requestId: data.request._id,
        customerId,
        customerName: email || customerEmail || "Employee",
        redeem: true,
        perk: true,
        perkRemaining: Math.max(0, remaining - 1),
        stamps: 0,
        threshold: 1,
      });
      pendingRequestIdRef.current = data.request._id;
      setStatus("waiting");
    } catch {
      setStatus("idle");
      toast.error("Something went wrong. Try again.");
    }
  }, [shopId, customerId, email, customerEmail, remaining, dailyLimit, send]);

  // Listen for the barista's decision.
  useEffect(() => {
    const unsubApproved = on("stamp-request:approved", () => {
      pendingRequestIdRef.current = null;
      setDrinksToday((n) => n + 1);
      setStatus("idle");
      toast.success("Enjoy your reward!");
    });
    const unsubRejected = on("stamp-request:rejected", () => {
      pendingRequestIdRef.current = null;
      setStatus("idle");
      toast.error("Request declined");
    });
    return () => {
      unsubApproved();
      unsubRejected();
    };
  }, [on]);

  // Auto-send a request as soon as the card opens — the whole flow is "scan and
  // the barista gets a ping". Only once per load, only when allowed and under
  // the cap.
  useEffect(() => {
    if (
      connected &&
      step === "done" &&
      !atLimit &&
      status === "idle" &&
      !autoRequestedRef.current
    ) {
      autoRequestedRef.current = true;
      requestDrink();
    }
  }, [connected, step, atLimit, status, requestDrink]);

  // If the customer leaves while a request is pending, tell the barista so they
  // aren't left staring at a request that will never resolve.
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
    return () => window.removeEventListener("pagehide", cancelPending);
  }, [send, customerId]);

  // Step 1 → 2: validate the work email and ask the server to mail a code.
  async function sendCode() {
    const value = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setEmailError("Please enter a valid email address");
      return;
    }
    // Don't name the allowed domain — staff already know theirs, and showing
    // it would let anyone scanning the QR spoof a valid address.
    if (!emailDomainAllowed(value, allowedDomains)) {
      setEmailError("Please use your work email address.");
      return;
    }
    setEmailError("");
    setSavingEmail(true);
    try {
      const res = await fetch("/api/perk/verify/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, customerId, email: value }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setEmailError(
          data.code === "DOMAIN_NOT_ALLOWED"
            ? "Please use your work email address."
            : data.error || "Could not send a code. Please try again.",
        );
        return;
      }
      setCode("");
      setCodeError("");
      setStep("code");
    } catch {
      setEmailError("Could not send a code. Please try again.");
    } finally {
      setSavingEmail(false);
    }
  }

  // Step 2 → done: confirm the 6-digit code the staff member received. Accepts
  // the value directly so the auto-submit on the 6th digit isn't racing the
  // async `code` state update.
  async function verifyCode(submitted?: string) {
    const value = (submitted ?? code).trim();
    if (!/^\d{6}$/.test(value)) {
      setCodeError("Enter the 6-digit code from your email.");
      return;
    }
    setCodeError("");
    setVerifyingCode(true);
    try {
      const res = await fetch("/api/perk/verify/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, code: value }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.code === "CODE_EXPIRED" || data.code === "TOO_MANY_ATTEMPTS") {
          setCodeError(data.error || "Request a new code.");
        } else {
          setCodeError(data.error || "Incorrect code. Try again.");
        }
        // Clear the field so they can retype cleanly (and re-trigger
        // auto-submit) rather than editing a wrong code in place.
        setCode("");
        return;
      }
      setStep("done");
    } catch {
      setCodeError("Could not verify. Please try again.");
    } finally {
      setVerifyingCode(false);
    }
  }

  async function resendCode() {
    setResending(true);
    setCodeError("");
    try {
      const res = await fetch("/api/perk/verify/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, customerId, email: email.trim().toLowerCase() }),
      });
      if (!res.ok) throw new Error("resend-failed");
      toast.success("New code sent — check your email.");
    } catch {
      setCodeError("Could not resend. Please try again.");
    } finally {
      setResending(false);
    }
  }

  async function saveDetails() {
    setDetailsError("");
    const trimmedName = name.trim();
    const newEmail = email.trim().toLowerCase();
    const emailChanged =
      emailEditable && newEmail !== (customerEmail || "").trim().toLowerCase();

    // Validate a changed email up front before touching the server.
    if (emailChanged) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
        setDetailsError("Please enter a valid email address");
        return;
      }
      if (!emailDomainAllowed(newEmail, allowedDomains)) {
        setDetailsError("Please use your work email address.");
        return;
      }
    }

    if (!trimmedName && !emailChanged) {
      setShowDetails(false);
      return;
    }
    setSavingDetails(true);
    try {
      if (trimmedName) {
        const res = await fetch(`/api/customers/${customerId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmedName }),
        });
        if (!res.ok) throw new Error("save-failed");
      }
      // A changed email must be re-verified — send a fresh code and drop the
      // customer into the code-entry step rather than silently trusting it.
      if (emailChanged) {
        const res = await fetch("/api/perk/verify/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shopId, customerId, email: newEmail }),
        });
        if (!res.ok) throw new Error("send-failed");
        setShowDetails(false);
        setCode("");
        setCodeError("");
        setStep("code");
        return;
      }
      toast.success("Details updated");
      setShowDetails(false);
    } catch {
      setDetailsError("Could not save. Please try again.");
    } finally {
      setSavingDetails(false);
    }
  }

  return (
    <div
      className="relative flex min-h-screen flex-col items-center p-4 pt-4 md:justify-center"
      style={{ backgroundColor: bgHex }}
    >
      {patternCSS && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: patternCSS }}
        />
      )}

      <div className="relative z-10 w-full max-w-sm space-y-6">
        {/* When editing details, hide the logo, card, and action for a clean,
            focused edit view (matches the stamp card's focused edit). */}
        {!showDetails && (
          <>
            {/* Logo banner — same treatment as the stamp card */}
            <div>
              {shopLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={shopLogo}
                  alt={shopName}
                  className="aspect-[3/1] w-full rounded-2xl object-cover shadow-lg"
                />
              ) : (
                <div
                  className="flex aspect-[3/1] w-full items-center justify-center rounded-2xl px-6 text-center shadow-lg"
                  style={{ backgroundColor: fgHex }}
                >
                  <h2
                    className="text-2xl font-bold leading-tight"
                    style={{ color: bgHex }}
                  >
                    {shopName}
                  </h2>
                </div>
              )}
            </div>

            {/* Body card — elevated surface, matching the stamp card */}
            <div className="rounded-2xl p-6" style={surfaceStyle(bgHex, fgHex)}>
              <p
                className="mb-4 text-center text-base font-semibold"
                style={{ color: fgHex }}
              >
                {shopName}{" "}
                <span style={{ opacity: 0.6 }}>&middot; Staff perk</span>
              </p>

              {step === "email" ? (
                /* Email gate — asked once, then remembered on this device. */
                <div className="space-y-3">
                  <Label
                    className="text-xs"
                    style={{ color: fgHex, opacity: 0.7 }}
                  >
                    Enter your work email to get your reward
                  </Label>
                  <Input
                    type="email"
                    inputMode="email"
                    autoCapitalize="none"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError("");
                    }}
                    placeholder="you@yourcompany.com"
                    style={{
                      borderColor: emailError ? "#f87171" : fgHex + "30",
                      backgroundColor: fgHex + "10",
                      color: fgHex,
                    }}
                    className="placeholder-inherit"
                  />
                  {emailError && (
                    <p className="text-xs text-red-400">{emailError}</p>
                  )}
                  <Button
                    onClick={sendCode}
                    disabled={savingEmail || !email.trim()}
                    className="w-full cursor-pointer hover:opacity-90"
                    style={{ backgroundColor: fgHex, color: bgHex }}
                  >
                    {savingEmail ? "Sending…" : "Continue"}
                  </Button>
                </div>
              ) : step === "code" ? (
                /* Code gate — prove control of the mailbox before any claim. */
                <div className="space-y-3">
                  <Label
                    className="text-xs"
                    style={{ color: fgHex, opacity: 0.7 }}
                  >
                    Enter the 6-digit code we emailed to{" "}
                    <span style={{ opacity: 1, fontWeight: 600 }}>
                      {email.trim().toLowerCase()}
                    </span>
                  </Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={code}
                    onChange={(e) => {
                      const next = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6);
                      setCode(next);
                      setCodeError("");
                      // Auto-submit the moment 6 digits are in (typed or
                      // pasted) — no extra tap needed at the counter.
                      if (next.length === 6 && !verifyingCode) verifyCode(next);
                    }}
                    placeholder="000000"
                    style={{
                      borderColor: codeError ? "#f87171" : fgHex + "30",
                      backgroundColor: fgHex + "10",
                      color: fgHex,
                      letterSpacing: "0.4em",
                      textAlign: "center",
                      fontSize: "1.25rem",
                    }}
                    className="placeholder-inherit"
                  />
                  {codeError && (
                    <p className="text-xs text-red-400">{codeError}</p>
                  )}
                  <Button
                    onClick={() => verifyCode()}
                    disabled={verifyingCode || code.length !== 6}
                    className="w-full cursor-pointer hover:opacity-90"
                    style={{ backgroundColor: fgHex, color: bgHex }}
                  >
                    {verifyingCode ? "Verifying…" : "Verify"}
                  </Button>
                  <div className="flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setStep("email");
                        setCodeError("");
                      }}
                      className="cursor-pointer underline-offset-2 hover:underline"
                      style={{ color: fgHex, opacity: 0.7 }}
                    >
                      Change email
                    </button>
                    <button
                      type="button"
                      onClick={resendCode}
                      disabled={resending}
                      className="cursor-pointer underline-offset-2 hover:underline disabled:opacity-50"
                      style={{ color: fgHex, opacity: 0.7 }}
                    >
                      {resending ? "Sending…" : "Resend code"}
                    </button>
                  </div>
                </div>
              ) : atLimit ? (
                <div className="text-center">
                  <div
                    className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
                    style={{ backgroundColor: fgHex + "22" }}
                  >
                    <Check className="h-6 w-6" style={{ color: fgHex }} />
                  </div>
                  <p className="mt-4 font-medium" style={{ color: fgHex }}>
                    That&apos;s your {dailyLimit} for today
                  </p>
                  <p
                    className="mt-1 text-sm"
                    style={{ color: fgHex, opacity: 0.7 }}
                  >
                    Come back tomorrow for more.
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <div
                    className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
                    style={{ backgroundColor: fgHex + "22" }}
                  >
                    <Coffee className="h-6 w-6" style={{ color: fgHex }} />
                  </div>
                  <p className="mt-4 text-sm" style={{ color: fgHex }}>
                    <span className="text-2xl font-bold">{remaining}</span> of{" "}
                    {dailyLimit} free reward{dailyLimit === 1 ? "" : "s"} left
                    today
                  </p>
                </div>
              )}
            </div>

            {/* Action area below the card, like the stamp card's Request button */}
            {step === "done" &&
              !atLimit &&
              (status === "waiting" ? (
                <CustomerWaiting fgColor={fgHex} language="en" />
              ) : (
                <div className="space-y-2 text-center">
                  <Button
                    onClick={requestDrink}
                    disabled={!connected || status === "requesting"}
                    size="lg"
                    className="w-full cursor-pointer text-base hover:opacity-90"
                    style={{ backgroundColor: fgHex, color: bgHex }}
                  >
                    <Coffee className="mr-2 h-5 w-5" />
                    {!connected
                      ? "Connecting…"
                      : status === "requesting"
                        ? "Sending…"
                        : "Get your reward"}
                  </Button>
                  <p className="text-xs" style={{ color: fgHex, opacity: 0.5 }}>
                    Show this screen to the barista to approve.
                  </p>
                </div>
              ))}
          </>
        )}

        {/* Update details — outlined button + expanding panel, matching the
            stamp card's "Update details" placement and styling. */}
        {step === "done" && status !== "waiting" && (
          <div>
            {!showDetails ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDetails(true);
                  setDetailsError("");
                }}
                className="w-full cursor-pointer hover:opacity-90"
                style={{
                  borderColor: fgHex + "40",
                  color: fgHex,
                  backgroundColor: "transparent",
                }}
              >
                <Pencil className="mr-1.5 h-4 w-4" />
                Update details
              </Button>
            ) : (
              <div
                className="space-y-3 rounded-2xl p-5"
                style={surfaceStyle(bgHex, fgHex)}
              >
                <div className="space-y-1.5">
                  <Label
                    className="text-xs"
                    style={{ color: fgHex, opacity: 0.7 }}
                  >
                    Your name
                  </Label>
                  <Input
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setDetailsError("");
                    }}
                    placeholder="Your name"
                    style={{
                      borderColor: fgHex + "30",
                      backgroundColor: fgHex + "10",
                      color: fgHex,
                    }}
                    className="placeholder-inherit"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    className="text-xs"
                    style={{ color: fgHex, opacity: 0.7 }}
                  >
                    Work email
                  </Label>
                  {emailEditable ? (
                    <Input
                      type="email"
                      inputMode="email"
                      autoCapitalize="none"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setDetailsError("");
                      }}
                      style={{
                        borderColor: fgHex + "30",
                        backgroundColor: fgHex + "10",
                        color: fgHex,
                      }}
                      className="placeholder-inherit"
                    />
                  ) : (
                    <>
                      <div
                        className="truncate rounded-md px-3 py-2 text-sm"
                        style={{
                          backgroundColor: fgHex + "10",
                          color: fgHex,
                          border: `1px solid ${fgHex}25`,
                        }}
                      >
                        {email || "—"}
                      </div>
                      <p
                        className="text-xs"
                        style={{ color: fgHex, opacity: 0.6 }}
                      >
                        You can change your email tomorrow, once today&apos;s
                        coffees reset.
                      </p>
                    </>
                  )}
                </div>
                {detailsError && (
                  <p className="text-xs text-red-400">{detailsError}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowDetails(false);
                      setDetailsError("");
                      setName(customerName || "");
                      setEmail(customerEmail || "");
                    }}
                    className="flex-1 cursor-pointer hover:opacity-90"
                    style={{
                      borderColor: fgHex + "40",
                      color: fgHex,
                      backgroundColor: "transparent",
                    }}
                  >
                    Close
                  </Button>
                  <Button
                    type="button"
                    onClick={saveDetails}
                    disabled={savingDetails}
                    className="flex-1 cursor-pointer hover:opacity-90"
                    style={{ backgroundColor: fgHex, color: bgHex }}
                  >
                    {savingDetails ? "Saving…" : "Save"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add to Wallet — optional upgrade; browser card stays the default. */}
        {step === "done" && (walletGoogle || walletApple) && (
          <AddToWallet
            shopId={shopId}
            customerId={customerId}
            google={walletGoogle}
            apple={walletApple}
          />
        )}

        {/* Powered by — right-aligned at the end of the column, like the
            stamp card. */}
        <div className="flex justify-end">
          <Link
            href="/"
            className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs transition-opacity hover:opacity-80"
            style={{ backgroundColor: fgHex + "15", color: fgHex }}
          >
            Powered by{" "}
            <span className="font-[family-name:var(--font-logo)] tracking-wide">
              Brewstamp
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
