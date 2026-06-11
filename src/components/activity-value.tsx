import type { ProgramConfig } from "@/lib/program";

/**
 * Renders the "value" of an approved transaction row in the activity tables
 * (dashboard Recent Check-ins + customer-detail History). Perk shops show a
 * flat free-coffee label; stamp shops show the stamp delta (+awarded, with the
 * -threshold cost on a redemption). Shared so the rule lives in one place.
 */
export function ActivityValue({
  status,
  redeem,
  stampsAwarded = 0,
  threshold,
  program,
}: {
  status: string;
  redeem?: boolean;
  stampsAwarded?: number;
  threshold: number;
  program: ProgramConfig;
}) {
  if (status !== "approved") {
    return <span className="text-muted-foreground">—</span>;
  }
  if (program.isPerk) {
    return <span className="text-amber-500">{program.eventLabel}</span>;
  }
  if (redeem && stampsAwarded === 0) {
    return <span className="text-muted-foreground">-{threshold}</span>;
  }
  if (redeem && stampsAwarded > 0) {
    return (
      <span>
        <span className="text-muted-foreground">-{threshold}</span>{" "}
        <span className="text-amber-500">+{stampsAwarded}</span>
      </span>
    );
  }
  return <span className="text-amber-500">+{stampsAwarded}</span>;
}
