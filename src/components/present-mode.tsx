"use client";

import { useEffect, useRef, useState } from "react";
import { X, Maximize, Check, Printer, Wifi, WifiOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { generateQRCodeWithLogo } from "@/lib/qr";
import { getColorHex } from "@/lib/tailwind-colors";
import { getPatternCSS } from "@/lib/patterns";
import { t } from "@/lib/i18n";

// A stamp that just landed — drives the 1.5s success flash before returning to
// the QR. Passed down from DashboardClient's approve handler.
export interface PresentFlash {
  name: string;
  stamps: number;
  threshold: number;
  redeemed: boolean;
  perk: boolean;
}

interface Props {
  shopCode: string;
  shopName: string;
  shopLogo: string | null;
  threshold: number;
  perkMode: boolean;
  dailyDrinkLimit: number;
  bgColor: string;
  fgColor: string;
  bgPattern: string;
  language: string;
  connected: boolean;
  flash: PresentFlash | null;
  isDefault: boolean;
  onToggleDefault: () => void;
  onExit: () => void;
}

/**
 * Full-screen "counter display": the shop flips their screen toward the
 * customer, who scans the big QR to collect a stamp. No printer needed — this is
 * the zero-print onboarding path. Rendered as a fixed overlay from the
 * persistent DashboardClient, so the approval modal appears over it and returns
 * here after each stamp.
 */
export default function PresentMode({
  shopCode,
  shopName,
  shopLogo,
  threshold,
  perkMode,
  dailyDrinkLimit,
  bgColor,
  fgColor,
  bgPattern,
  language,
  connected,
  flash,
  isDefault,
  onToggleDefault,
  onExit,
}: Props) {
  const [qr, setQr] = useState<string | null>(null);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const bgHex = getColorHex(bgColor);
  const fgHex = getColorHex(fgColor);
  const patternCSS = getPatternCSS(bgPattern, fgHex, 0.05);

  // Big, crisp QR for counter-distance scanning.
  useEffect(() => {
    generateQRCodeWithLogo(`${appUrl}/s/${shopCode}`, {
      width: 720,
      logoColor: fgHex,
    }).then(setQr);
  }, [appUrl, shopCode, fgHex]);

  // Esc exits.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onExit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onExit]);

  // Keep the screen awake while presenting (counter tablets sleep otherwise).
  // Re-acquire when the tab returns to the foreground. Best-effort — silently
  // no-ops where the Wake Lock API is unavailable.
  const wakeRef = useRef<WakeLockSentinel | null>(null);
  useEffect(() => {
    let cancelled = false;
    const acquire = async () => {
      try {
        if (document.visibilityState !== "visible") return;
        wakeRef.current = await navigator.wakeLock?.request("screen");
      } catch {
        /* unsupported or denied */
      }
    };
    acquire();
    const onVis = () => {
      if (document.visibilityState === "visible" && !cancelled) acquire();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      wakeRef.current?.release().catch(() => {});
      wakeRef.current = null;
    };
  }, []);

  function goFullscreen() {
    document.documentElement.requestFullscreen?.().catch(() => {});
  }

  const eyebrow = perkMode
    ? "STAFF COFFEE PERK"
    : t(language, "loyaltyCardEyebrow");
  const hero = perkMode
    ? `${dailyDrinkLimit} free coffee${dailyDrinkLimit === 1 ? "" : "s"} a day.`
    : t(language, "buyXGetFree", { n: threshold });

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col overflow-hidden"
      style={{ backgroundColor: bgHex }}
      dir="ltr"
    >
      {patternCSS && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: patternCSS }}
        />
      )}

      {/* Merchant controls — deliberately understated so they don't distract the
          customer, but reachable to exit / go fullscreen. */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3">
        <div
          className="flex items-center gap-1.5 text-xs font-medium"
          style={{ color: fgHex, opacity: 0.7 }}
          title={connected ? "Live — scans arrive instantly" : "Reconnecting…"}
        >
          {connected ? (
            <Wifi className="size-3.5" />
          ) : (
            <WifiOff className="size-3.5" />
          )}
          {connected ? "Live" : "Reconnecting…"}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goFullscreen}
            className="flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-opacity hover:opacity-100"
            style={{ color: fgHex, opacity: 0.7 }}
          >
            <Maximize className="size-3.5" />
            Fullscreen
          </button>
          <button
            type="button"
            onClick={onExit}
            className="flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-opacity hover:opacity-100"
            style={{ color: fgHex, opacity: 0.7 }}
          >
            <X className="size-3.5" />
            Exit
          </button>
        </div>
      </div>

      {/* Customer-facing hero — logo, reward, scan instruction, QR. */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-4 text-center">
        <div className="w-full max-w-md">
          {shopLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shopLogo}
              alt={shopName}
              className="mx-auto mb-6 aspect-[3/1] w-full max-w-xs rounded-2xl object-cover shadow-lg"
            />
          ) : (
            <div
              className="mx-auto mb-6 flex aspect-[3/1] w-full max-w-xs items-center justify-center rounded-2xl px-6 shadow-lg"
              style={{ backgroundColor: fgHex }}
            >
              <span
                className="text-2xl font-bold leading-tight"
                style={{ color: bgHex }}
              >
                {shopName}
              </span>
            </div>
          )}

          <p
            className="text-xs font-semibold uppercase tracking-[0.18em]"
            style={{ color: fgHex, opacity: 0.6 }}
          >
            {eyebrow}
          </p>
          <h1
            className="mt-2 text-2xl font-bold sm:text-3xl"
            style={{ color: fgHex }}
          >
            {hero}
          </h1>
          <p
            className="mt-4 text-base font-medium"
            style={{ color: fgHex, opacity: 0.85 }}
          >
            {t(language, "scanWithCamera")}
          </p>

          {/* The QR itself — white card so it scans on any brand colour. */}
          <div className="mx-auto mt-5 aspect-square w-[min(64vmin,420px)] rounded-3xl bg-white p-4 shadow-2xl sm:p-6">
            {qr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qr}
                alt="Scan to collect your stamp"
                className="h-full w-full"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-stone-400">
                Loading…
              </div>
            )}
          </div>

          <p
            className="mt-5 text-sm"
            style={{ color: fgHex, opacity: 0.65 }}
          >
            {t(language, "noAppRequired")}
          </p>
        </div>
      </div>

      {/* Footer — per-device default toggle + printing pointer. Staff controls,
          styled as clear pills on a subtle scrim so they read on any brand
          colour without shouting at the customer. */}
      <div className="relative z-10 flex flex-wrap items-center justify-center gap-3 px-4 py-4 text-sm">
        <label
          className="flex cursor-pointer items-center gap-3 rounded-full border px-4 py-2"
          style={{
            color: fgHex,
            borderColor: `${fgHex}55`,
            backgroundColor: "rgba(0,0,0,0.16)",
          }}
        >
          <Switch checked={isDefault} onCheckedChange={onToggleDefault} />
          <span className="font-medium">
            Open automatically on this device
          </span>
        </label>
        <a
          href="/dashboard/settings"
          className="flex items-center gap-2 rounded-full border px-4 py-2 font-medium transition-colors hover:bg-black/10"
          style={{
            color: fgHex,
            borderColor: `${fgHex}33`,
            backgroundColor: "rgba(0,0,0,0.16)",
          }}
        >
          <Printer className="size-4" />
          Prefer a printout?
        </a>
      </div>

      {/* Success flash — 1.5s confirmation after an approval, then the parent
          clears `flash` and we're back on the QR. */}
      {flash && (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 text-center"
          style={{ backgroundColor: bgHex }}
        >
          <div
            className="flex size-28 items-center justify-center rounded-full"
            style={{ backgroundColor: fgHex }}
          >
            <Check className="size-16" style={{ color: bgHex }} strokeWidth={3} />
          </div>
          <div>
            <p className="text-3xl font-bold" style={{ color: fgHex }}>
              {flash.perk || flash.redeemed ? "Free reward redeemed!" : "Stamp added!"}
            </p>
            <p
              className="mt-2 text-xl font-medium"
              style={{ color: fgHex, opacity: 0.85 }}
            >
              {flash.name}
              {!flash.perk && (
                <span style={{ opacity: 0.7 }}>
                  {" "}
                  · {flash.stamps}/{flash.threshold}
                </span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
