"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NewShopForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/shops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      // The server already enforces the plan shopLimit — if the user got
      // here past the page-level guard (e.g. via a stale tab), redirect
      // them to the billing page with the upgrade prompt.
      if (data.limitReached) {
        window.location.href = "/dashboard/billing?limit=1";
        return;
      }
      setLoading(false);
      setError(data.error || "Failed to create shop");
      return;
    }

    window.location.href = "/dashboard?init=1";
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">Shop name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Bean &amp; Brew — Newcastle"
          required
          autoFocus
        />
        <p className="text-xs text-muted-foreground">
          You can customise colours, logo, and threshold after the shop is
          created.
        </p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={loading || !name.trim()}
          className="cursor-pointer"
        >
          {loading ? "Creating..." : "Create shop"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          className="cursor-pointer"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
