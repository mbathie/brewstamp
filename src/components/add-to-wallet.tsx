"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Wallet } from "lucide-react";

// Customer-facing "Add to Apple/Google Wallet" buttons. Additive — the browser
// card is always the default; this is an optional upgrade. Shows the button
// matching the device (both on desktop). Fetches the signed link on click so we
// don't create wallet objects for cards nobody adds.
export function AddToWallet({
  shopId,
  customerId,
  google,
  apple,
  fgColor = "#ffffff",
  bgColor = "#1c1917",
}: {
  shopId: string;
  customerId: string;
  google: boolean;
  apple: boolean;
  fgColor?: string;
  bgColor?: string;
}) {
  const [loading, setLoading] = useState<"google" | "apple" | null>(null);

  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isIOS = /iPhone|iPad|iPod/i.test(ua) ||
    (/Macintosh/i.test(ua) && typeof navigator !== "undefined" && (navigator as any).maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const showGoogle = google && (isAndroid || (!isIOS && !isAndroid));
  const showApple = apple && (isIOS || (!isIOS && !isAndroid));

  if (!showGoogle && !showApple) return null;

  async function add(provider: "google" | "apple") {
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

  return (
    <div className="flex flex-col gap-2">
      {showApple && (
        <button
          type="button"
          onClick={() => add("apple")}
          disabled={loading !== null}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: bgColor, color: fgColor }}
        >
          <Wallet className="h-4 w-4" />
          {loading === "apple" ? "Adding…" : "Add to Apple Wallet"}
        </button>
      )}
      {showGoogle && (
        <button
          type="button"
          onClick={() => add("google")}
          disabled={loading !== null}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: bgColor, color: fgColor }}
        >
          <Wallet className="h-4 w-4" />
          {loading === "google" ? "Adding…" : "Add to Google Wallet"}
        </button>
      )}
    </div>
  );
}
