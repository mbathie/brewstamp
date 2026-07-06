import { Badge } from "@/components/ui/badge";

// Approved/other outline badge, shared by the dashboard and customer-detail
// history tables (was copy-pasted verbatim in both).
export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={
        status === "approved"
          ? "border-green-500/50 text-green-500"
          : "border-red-400/50 text-red-400"
      }
    >
      {status}
    </Badge>
  );
}
