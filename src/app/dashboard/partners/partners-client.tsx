"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Data {
  ratePercent: number;
  months: number;
  partner: boolean;
  code?: string;
  link?: string;
  payoutEmail?: string | null;
  referredUsers?: number;
  shops?: Array<{ id: string; name: string; ownerEmailMasked: string; signedUpAt: string; paying: boolean; payments: number; earnedCents: number; currency: string }>;
  owed?: Record<string, number>;
  paid?: Record<string, number>;
  earnings?: Array<{ id: string; shop: string; earnedAt: string; paymentAmountCents: number; amountCents: number; currency: string; paidOutAt: string | null }>;
}

const sym = (c: string) => (c === "aud" ? "A$" : c === "usd" ? "US$" : c.toUpperCase() + " ");
const money = (cents: number, c: string) => `${sym(c)}${(cents / 100).toFixed(2)}`;
const total = (m: Record<string, number> | undefined) => {
  const parts = Object.entries(m ?? {}).map(([c, v]) => money(v, c));
  return parts.length ? parts.join(" + ") : "US$0.00";
};
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "2-digit" });

export default function PartnersClient() {
  const [data, setData] = useState<Data | null>(null);
  const [payoutEmail, setPayoutEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  function load() {
    return fetch("/api/partners").then((r) => r.json()).then((d: Data) => { setData(d); setPayoutEmail(d.payoutEmail ?? ""); });
  }
  useEffect(() => { load(); }, []);

  async function join() {
    setSaving(true);
    try {
      const res = await fetch("/api/partners", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ payoutEmail }) });
      const j = await res.json();
      if (!res.ok) { toast.error(j.error || "Could not join"); return; }
      toast.success(data?.partner ? "Payout email saved" : "You're in — here's your link");
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function copy() {
    if (!data?.link) return;
    await navigator.clipboard.writeText(data.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (!data) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Partners</h1>
        <p className="text-muted-foreground">
          Refer cafés to Brewstamp and earn {data.ratePercent}% of everything they pay for their first {data.months} months.{" "}
          <Link href="/partners" className="text-amber-500 hover:underline" target="_blank">How it works</Link>
        </p>
      </div>

      {!data.partner ? (
        <Card>
          <CardHeader>
            <CardTitle>Join the partner program</CardTitle>
            <CardDescription>Free, no approval. Add the PayPal email you&apos;d like payouts sent to (you can add it later).</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Input type="email" placeholder="PayPal email for payouts (optional)" value={payoutEmail} onChange={(e) => setPayoutEmail(e.target.value)} className="sm:max-w-sm" />
            <Button onClick={join} disabled={saving} className="cursor-pointer bg-amber-700 text-white hover:bg-amber-800">
              {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null} Get my referral link
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardDescription>Your referral link</CardDescription>
                <CardTitle className="text-lg">Share this anywhere</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input readOnly value={data.link} className="font-mono text-sm" onFocus={(e) => e.currentTarget.select()} />
                  <Button variant="outline" onClick={copy} className="cursor-pointer shrink-0">
                    {copied ? <Check className="mr-1.5 size-4 text-emerald-500" /> : <Copy className="mr-1.5 size-4" />} {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Anyone who signs up within 90 days of clicking is attributed to you. Code <span className="font-mono text-foreground">{data.code}</span>.
                </p>
                <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                  <Input type="email" placeholder="PayPal email for payouts" value={payoutEmail} onChange={(e) => setPayoutEmail(e.target.value)} className="sm:max-w-sm" />
                  <Button variant="outline" onClick={join} disabled={saving} className="cursor-pointer">{saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null} Save payout email</Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Earnings</CardDescription>
                <CardTitle className="text-2xl">{total(data.owed)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                <div>owed · paid out {total(data.paid)}</div>
                <div>{data.referredUsers} referred signup{data.referredUsers === 1 ? "" : "s"} · {data.shops?.filter((s) => s.paying).length ?? 0} paying</div>
                <div className="pt-1 text-xs">Paid quarterly by PayPal once you reach US$25.</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Referred shops</CardTitle>
              <CardDescription>Shops created by people who signed up through your link.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {data.shops && data.shops.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Shop</TableHead>
                      <TableHead>Signed up</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Payments</TableHead>
                      <TableHead className="text-right">You&apos;ve earned</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.shops.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>
                          <div className="font-medium text-foreground">{s.name}</div>
                          <div className="text-xs text-muted-foreground">{s.ownerEmailMasked}</div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{fmtDate(s.signedUpAt)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={s.paying ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300" : "border-border text-muted-foreground"}>
                            {s.paying ? "paying" : "free"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{s.payments}</TableCell>
                        <TableCell className="text-right text-foreground">{s.paying ? money(s.earnedCents, s.currency) : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="px-6 py-10 text-center text-sm text-muted-foreground">No referred shops yet. Share your link to get started.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
