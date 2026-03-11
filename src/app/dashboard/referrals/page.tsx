"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Gift, Copy, Users, DollarSign, Loader2 } from "lucide-react";

interface ReferralData {
  referralCode: string;
  totalReferrals: number;
  conversions: number;
  rewardsEarned: number;
  shops: {
    _id: string;
    name: string;
    createdAt: string;
    subscribed: boolean;
  }[];
}

export default function ReferralsPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/referrals")
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const copyLink = () => {
    if (!data) return;
    const url = `${window.location.origin}/r/${data.referralCode}`;
    navigator.clipboard.writeText(url);
    toast.success("Referral link copied!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) return null;

  const referralUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/r/${data.referralCode}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Referrals
        </h1>
        <p className="text-muted-foreground">
          Invite other shops to Brewstamp and earn free months of Pro.
        </p>
      </div>

      {/* Referral Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="size-5" />
            Your Referral Link
          </CardTitle>
          <CardDescription>
            Share this link with other shop owners. They get 1 free month of
            Pro, and you get 2 free months when they subscribe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-md border bg-muted px-3 py-2 text-sm">
              {referralUrl}
            </code>
            <Button onClick={copyLink} variant="outline" size="sm">
              <Copy className="mr-1.5 size-4" />
              Copy
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Users className="size-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.totalReferrals}</p>
                <p className="text-sm text-muted-foreground">Total Referrals</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <Gift className="size-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.conversions}</p>
                <p className="text-sm text-muted-foreground">Subscribed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10">
                <DollarSign className="size-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">${data.rewardsEarned}</p>
                <p className="text-sm text-muted-foreground">Rewards Earned</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referred Shops */}
      {data.shops.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Referred Shops</CardTitle>
            <CardDescription>
              Shops that signed up through your referral link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shop Name</TableHead>
                  <TableHead>Date Joined</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.shops.map((shop) => (
                  <TableRow key={shop._id}>
                    <TableCell className="font-medium">{shop.name}</TableCell>
                    <TableCell>
                      {new Date(shop.createdAt).toLocaleDateString("en-AU", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={shop.subscribed ? "default" : "secondary"}
                        className={
                          shop.subscribed
                            ? "bg-emerald-500/15 text-emerald-400"
                            : ""
                        }
                      >
                        {shop.subscribed ? "Subscribed" : "Signed Up"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Gift className="mx-auto mb-3 size-10 text-muted-foreground/50" />
            <p className="text-lg font-medium text-foreground">
              No referrals yet
            </p>
            <p className="text-sm text-muted-foreground">
              Share your link with other shop owners to start earning rewards.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
