"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type Provider = "google" | "apple";

// Customer-facing "Add to Apple/Google Wallet" buttons using each vendor's
// official badge artwork. Additive — the browser card is always the default;
// this is an optional upgrade. Shows the badge matching the device (both on
// desktop). Fetches the signed link on click so we don't create wallet objects
// for cards nobody adds.
//
// The button stays visible even after adding: a website can't reliably tell
// whether a pass is currently in someone's wallet, and re-adding is idempotent
// on both platforms (Google updates the existing card, Apple re-installs the
// same pass) — so always-available is the safe, standard behaviour.
export function AddToWallet({
  shopId,
  customerId,
  google,
  apple,
}: {
  shopId: string;
  customerId: string;
  google: boolean;
  apple: boolean;
}) {
  const [loading, setLoading] = useState<Provider | null>(null);

  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isIOS = /iPhone|iPad|iPod/i.test(ua) ||
    (/Macintosh/i.test(ua) && typeof navigator !== "undefined" && (navigator as any).maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const showGoogle = google && (isAndroid || (!isIOS && !isAndroid));
  const showApple = apple && (isIOS || (!isIOS && !isAndroid));

  if (!showGoogle && !showApple) return null;

  async function add(provider: Provider) {
    setLoading(provider);
    try {
      const res = await fetch("/api/wallet/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, customerId }),
      });
      const data = await res.json().catch(() => ({}));
      const url = data?.links?.[provider];
      if (!res.ok || !url) {
        toast.error("Couldn't add to wallet. Try again.");
        return;
      }
      window.location.href = url;
    } catch {
      toast.error("Couldn't add to wallet. Try again.");
    } finally {
      setLoading(null);
    }
  }

  // Official vendor badge artwork — required by Apple & Google brand
  // guidelines (no recreating). The badge IS the button; clicking it runs the
  // save flow. h-12 ≈ 48dp, meeting Google's minimum.
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {showApple && (
        <button
          type="button"
          onClick={() => add("apple")}
          disabled={loading !== null}
          aria-label="Add to Apple Wallet"
          aria-busy={loading === "apple"}
          className="relative cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/badges/add-to-apple-wallet.svg"
            alt="Add to Apple Wallet"
            className={`h-12 w-auto ${loading === "apple" ? "opacity-30" : ""}`}
          />
          {loading === "apple" && (
            <span className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            </span>
          )}
        </button>
      )}
      {showGoogle && (
        <button
          type="button"
          onClick={() => add("google")}
          disabled={loading !== null}
          aria-label="Add to Google Wallet"
          aria-busy={loading === "google"}
          className="relative cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/badges/add-to-google-wallet.svg"
            alt="Add to Google Wallet"
            className={`h-12 w-auto ${loading === "google" ? "opacity-30" : ""}`}
          />
          {loading === "google" && (
            <span className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            </span>
          )}
        </button>
      )}
    </div>
  );
}
