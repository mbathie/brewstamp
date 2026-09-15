"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Row {
  id: string; email: string; name: string; code: string; payoutEmail: string | null; since: string | null;
  referredSignups: number; referredShops: number; payingShops: number;
  owed: Record<string, number>; paid: Record<string, number>;
}
const sym = (c: string) => (c === "aud" ? "A$" : c === "usd" ? "US$" : c.toUpperCase() + " ");
const total = (m: Record<string, number>) => { const p = Object.entries(m).map(([c, v]) => `${sym(c)}${(v / 100).toFixed(2)}`); return p.length ? p.join(" + ") : "—"; };

export default function AdminPartnersClient() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const load = () => fetch("/api/admin/partners").then((r) => r.json()).then((d) => setRows(d.partners ?? []));
  useEffect(() => { load(); }, []);

  async function markPaid(r: Row) {
    if (!window.confirm(`Mark ${total(r.owed)} as paid out to ${r.payoutEmail ?? r.email}?`)) return;
    setBusy(r.id);
    try {
      const res = await fetch("/api/admin/partners", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ partnerId: r.id, note: "paid via PayPal" }) });
      const j = await res.json();
      if (!res.ok) { toast.error(j.error || "Failed"); return; }
      toast.success(`Marked ${j.marked} earning${j.marked === 1 ? "" : "s"} paid`);
      await load();
    } finally { setBusy(null); }
  }

  if (!rows) return <div className="flex items-center justify-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Partners</h1>
        <p className="text-sm text-muted-foreground">Referral partners, what they&apos;ve brought in, and what they&apos;re owed. Pay via PayPal, then mark paid.</p>
      </div>
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partner</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Payout email</TableHead>
                <TableHead className="text-right">Signups</TableHead>
                <TableHead className="text-right">Shops</TableHead>
                <TableHead className="text-right">Paying</TableHead>
                <TableHead className="text-right">Owed</TableHead>
                <TableHead className="text-right">Paid out</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && <TableRow><TableCell colSpan={9} className="py-10 text-center text-sm text-muted-foreground">No partners yet.</TableCell></TableRow>}
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell><div className="font-medium text-foreground">{r.name}</div><div className="text-xs text-muted-foreground">{r.email}</div></TableCell>
                  <TableCell className="font-mono text-xs">{r.code}</TableCell>
                  <TableCell className="text-muted-foreground">{r.payoutEmail ?? <span className="text-amber-400">not set</span>}</TableCell>
                  <TableCell className="text-right">{r.referredSignups}</TableCell>
                  <TableCell className="text-right">{r.referredShops}</TableCell>
                  <TableCell className="text-right">{r.payingShops}</TableCell>
                  <TableCell className="text-right text-foreground">{total(r.owed)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{total(r.paid)}</TableCell>
                  <TableCell className="text-right">
                    {Object.keys(r.owed).length > 0 && (
                      <Button size="sm" variant="outline" className="cursor-pointer" disabled={busy === r.id} onClick={() => markPaid(r)}>
                        {busy === r.id ? <Loader2 className="mr-1.5 size-3 animate-spin" /> : null} Mark paid
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
