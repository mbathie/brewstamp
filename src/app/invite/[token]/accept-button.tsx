"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AcceptInviteButton({ token }: { token: string }) {
  const [loading, setLoading] = useState(false);

  async function accept() {
    setLoading(true);
    try {
      const res = await fetch("/api/invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Couldn't accept the invite.");
        setLoading(false);
        return;
      }
      // Cookie is already set to the new shop — drop into the dashboard.
      window.location.href = "/dashboard";
    } catch {
      toast.error("Couldn't accept the invite.");
      setLoading(false);
    }
  }

  return (
    <Button
      onClick={accept}
      disabled={loading}
      className="w-full cursor-pointer bg-amber-700 hover:bg-amber-800"
    >
      {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
      Accept invite
    </Button>
  );
}
