"use client";

import { useState } from "react";
import { Eye, X } from "lucide-react";

/**
 * Persistent, unmissable marker that the dashboard below is somebody else's.
 * Deliberately not dismissable — the whole risk of "view as" is forgetting
 * you're in it, so the only way out is the button that actually exits.
 */
export default function ImpersonationBanner({
  email,
  shopName,
}: {
  email: string;
  shopName: string;
}) {
  const [exiting, setExiting] = useState(false);

  async function stop() {
    setExiting(true);
    await fetch("/api/admin/impersonate", { method: "DELETE" });
    // Full reload: the server context, sidebar and every cached page were
    // rendered as the other user.
    window.location.href = "/dashboard/admin/shops";
  }

  return (
    <div className="sticky top-0 z-50 flex items-center gap-3 bg-amber-600 px-4 py-2 text-sm text-white">
      <Eye className="size-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">
        Viewing as <strong className="font-semibold">{email}</strong> ·{" "}
        {shopName} — read-only
      </span>
      <button
        type="button"
        onClick={stop}
        disabled={exiting}
        className="flex shrink-0 cursor-pointer items-center gap-1 rounded border border-white/40 px-2 py-0.5 text-xs font-medium hover:bg-white/15 disabled:opacity-60"
      >
        <X className="size-3" />
        {exiting ? "Exiting..." : "Exit"}
      </button>
    </div>
  );
}
