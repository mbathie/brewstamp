import { Loader2 } from "lucide-react";

// Streaming fallback for the dashboard segment while the RSC fetches data —
// avoids a blank screen on navigation.
export default function DashboardLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
}
