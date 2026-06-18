"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Ticket, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { DateField } from "@/components/date-field";

interface Discount {
  id: string;
  code: string;
  active: boolean;
  percentOff: number | null;
  plan: string;
  duration: "once" | "forever" | "repeating";
  durationInMonths: number | null;
  expiresAt: number | null;
  maxRedemptions: number | null;
  timesRedeemed: number;
  created: number;
}

const PLAN_LABEL: Record<string, string> = {
  any: "Any plan",
  pro: "Pro",
  plus: "Plus",
  max: "Max",
};

function fmtDate(unix: number | null): string {
  if (!unix) return "—";
  return new Date(unix * 1000).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "2-digit",
  });
}

function durationText(d: Discount): string {
  if (d.duration === "once") return "First payment";
  if (d.duration === "forever") return "Forever";
  return `${d.durationInMonths ?? "?"} months`;
}

function randomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 8; i++)
    out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export default function DiscountsClient() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // Create form
  const [code, setCode] = useState("");
  const [percentOff, setPercentOff] = useState("");
  const [plan, setPlan] = useState("any");
  const [duration, setDuration] = useState<"once" | "forever" | "repeating">(
    "once",
  );
  const [months, setMonths] = useState("3");
  const [expiry, setExpiry] = useState<Date | null>(null);
  const [maxRedemptions, setMaxRedemptions] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/discounts");
      const data = await res.json();
      setDiscounts(data.discounts || []);
    } catch {
      toast.error("Could not load discounts.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function resetForm() {
    setCode("");
    setPercentOff("");
    setPlan("any");
    setDuration("once");
    setMonths("3");
    setExpiry(null);
    setMaxRedemptions("");
    setError("");
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCreating(true);
    try {
      // End of the chosen local day, so a code is valid through its whole
      // expiry date.
      const expiresAt = expiry
        ? Math.floor(
            new Date(
              expiry.getFullYear(),
              expiry.getMonth(),
              expiry.getDate(),
              23,
              59,
              59,
            ).getTime() / 1000,
          )
        : undefined;
      const res = await fetch("/api/admin/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          percentOff,
          plan,
          duration,
          durationInMonths: duration === "repeating" ? months : undefined,
          expiresAt,
          maxRedemptions: maxRedemptions || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Could not create discount.");
        return;
      }
      toast.success("Discount created");
      setOpen(false);
      resetForm();
      load();
    } catch {
      setError("Could not create discount.");
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(d: Discount) {
    try {
      const res = await fetch(`/api/admin/discounts/${d.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !d.active }),
      });
      if (!res.ok) throw new Error();
      setDiscounts((list) =>
        list.map((x) => (x.id === d.id ? { ...x, active: !d.active } : x)),
      );
      toast.success(d.active ? "Code disabled" : "Code enabled");
    } catch {
      toast.error("Could not update code.");
    }
  }

  const sorted = useMemo(
    () => [...discounts].sort((a, b) => b.created - a.created),
    [discounts],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Discounts</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={load}
            className="cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="size-4" />
          </Button>
          <Dialog
            open={open}
            onOpenChange={(o) => {
              setOpen(o);
              if (o && !code) setCode(randomCode());
              if (!o) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button className="cursor-pointer bg-amber-700 hover:bg-amber-800">
                <Plus className="mr-1 size-4" />
                New code
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create discount code</DialogTitle>
              </DialogHeader>
              <form onSubmit={create} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="code"
                      value={code}
                      onChange={(e) =>
                        setCode(e.target.value.toUpperCase().replace(/\s/g, ""))
                      }
                      placeholder="LAUNCH20"
                      className="font-mono"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCode(randomCode())}
                      className="cursor-pointer whitespace-nowrap"
                    >
                      Generate
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="percent">Percent off</Label>
                    <Input
                      id="percent"
                      type="number"
                      min={1}
                      max={100}
                      value={percentOff}
                      onChange={(e) => setPercentOff(e.target.value)}
                      placeholder="20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Plan</Label>
                    <Select value={plan} onValueChange={setPlan}>
                      <SelectTrigger className="w-full cursor-pointer">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any plan</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="plus">Plus</SelectItem>
                        <SelectItem value="max">Max</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Applies to</Label>
                    <Select
                      value={duration}
                      onValueChange={(v) =>
                        setDuration(v as "once" | "forever" | "repeating")
                      }
                    >
                      <SelectTrigger className="w-full cursor-pointer">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="once">First payment</SelectItem>
                        <SelectItem value="repeating">N months</SelectItem>
                        <SelectItem value="forever">Forever</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {duration === "repeating" && (
                    <div className="space-y-2">
                      <Label htmlFor="months">Months</Label>
                      <Input
                        id="months"
                        type="number"
                        min={1}
                        value={months}
                        onChange={(e) => setMonths(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Expires (optional)</Label>
                    <DateField
                      id="expiry"
                      value={expiry}
                      onChange={setExpiry}
                      min={new Date()}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxr">Max uses (optional)</Label>
                    <Input
                      id="maxr"
                      type="number"
                      min={1}
                      value={maxRedemptions}
                      onChange={(e) => setMaxRedemptions(e.target.value)}
                      placeholder="Unlimited"
                    />
                  </div>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button
                  type="submit"
                  className="w-full cursor-pointer bg-amber-700 hover:bg-amber-800"
                  disabled={creating}
                >
                  {creating ? "Creating…" : "Create code"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-16 text-center">
          <Ticket className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No discount codes yet. Create one to offer a percentage off a plan.
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Off</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Applies to</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Used</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-mono font-medium">{d.code}</TableCell>
                <TableCell>{d.percentOff ?? "—"}%</TableCell>
                <TableCell>{PLAN_LABEL[d.plan] || d.plan}</TableCell>
                <TableCell className="text-muted-foreground">
                  {durationText(d)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {fmtDate(d.expiresAt)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {d.timesRedeemed}
                  {d.maxRedemptions ? ` / ${d.maxRedemptions}` : ""}
                </TableCell>
                <TableCell>
                  {d.active ? (
                    <Badge className="border-emerald-500/30 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15">
                      Active
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-border text-muted-foreground"
                    >
                      Disabled
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(d)}
                    className="cursor-pointer"
                  >
                    {d.active ? "Disable" : "Enable"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
