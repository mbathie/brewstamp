import Link from "next/link";
import { AlertTriangle, CreditCard } from "lucide-react";
import type { BillingNotice } from "@/lib/billing-notice";

// Full-width billing notice at the top of every dashboard page. Not
// dismissable: each state it shows either blocks stamping, risks the plan, or
// needs a card before the next renewal.
const TONE = {
  danger: {
    bar: "border-red-500/30 bg-red-500/10",
    icon: "text-red-400",
    button: "bg-red-600 text-white hover:bg-red-700",
  },
  warning: {
    bar: "border-amber-500/30 bg-amber-500/10",
    icon: "text-amber-400",
    button: "bg-amber-700 text-white hover:bg-amber-800",
  },
} as const;

function BodyWithLink({ notice }: { notice: BillingNotice }) {
  const { body, bodyLink, action } = notice;
  const i = bodyLink && action ? body.indexOf(bodyLink) : -1;
  if (i < 0 || !action || !bodyLink) return <>{body}</>;
  return (
    <>
      {body.slice(0, i)}
      <Link href={action.href} className="font-medium text-foreground underline underline-offset-2 hover:opacity-80">
        {bodyLink}
      </Link>
      {body.slice(i + bodyLink.length)}
    </>
  );
}

export default function BillingBanner({ notice }: { notice: BillingNotice }) {
  const t = TONE[notice.tone];
  const Icon = notice.kind === "save_card" ? CreditCard : AlertTriangle;
  return (
    <div
      role={notice.tone === "danger" ? "alert" : "status"}
      className={`flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-4 py-2.5 ${t.bar}`}
    >
      <Icon className={`size-4 shrink-0 ${t.icon}`} aria-hidden />
      <p className="min-w-0 flex-1 text-sm">
        <span className="font-medium text-foreground">{notice.title}.</span>{" "}
        <span className="text-muted-foreground">
          <BodyWithLink notice={notice} />
        </span>
      </p>
      {notice.action && (
        <Link
          href={notice.action.href}
          className={`inline-flex h-8 shrink-0 items-center rounded-md px-3 text-sm font-medium transition-colors ${t.button}`}
        >
          {notice.action.label}
        </Link>
      )}
    </div>
  );
}
