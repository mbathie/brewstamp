// Single source of truth for the per-program-type presentation: stamp shops
// collect stamps toward a reward; perk shops give a free coffee per scan
// (employer-subsidised). Reporting surfaces read their labels/units from here
// instead of scattering `perkMode ? "…" : "…"` ternaries — so wording changes
// in one place, and there's no per-surface branch to forget.
//
// `perkMode` stays the stored flag on the Shop; this is the derived behaviour.

export interface ProgramConfig {
  isPerk: boolean;
  /** Singular unit of activity, e.g. "stamp" / "free coffee". */
  unit: string;
  /** Plural unit, e.g. "stamps" / "free coffees". */
  unitPlural: string;
  /** Dashboard primary KPI label. */
  kpiLabel: string;
  /** Activity-chart series label. */
  activityLabel: string;
  /** Label shown for an approved event in recent activity / history. */
  eventLabel: string;
  /** Top-customers value-column header. */
  topColumnLabel: string;
  /** Customer-detail loyalty-card title. */
  detailTitle: string;
}

const STAMP: ProgramConfig = {
  isPerk: false,
  unit: "stamp",
  unitPlural: "stamps",
  kpiLabel: "Stamps Given",
  activityLabel: "Stamps",
  eventLabel: "Stamp",
  topColumnLabel: "Stamps",
  detailTitle: "Loyalty",
};

const PERK: ProgramConfig = {
  isPerk: true,
  unit: "free reward",
  unitPlural: "free rewards",
  kpiLabel: "Free rewards given",
  activityLabel: "Free rewards",
  eventLabel: "Free reward",
  topColumnLabel: "Free rewards",
  detailTitle: "Staff perk",
};

export function getProgram(perkMode: boolean | undefined): ProgramConfig {
  return perkMode ? PERK : STAMP;
}
