"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

// Error boundary for the dashboard segment — the pages do live DB work in RSCs,
// so a transient failure gets a recover button instead of the bare global error.
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard] render error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
        <AlertTriangle className="size-6" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Something went wrong
        </h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          We couldn&apos;t load this page. This is usually temporary — try again.
        </p>
      </div>
      <Button onClick={reset} className="cursor-pointer">
        Try again
      </Button>
    </div>
  );
}
