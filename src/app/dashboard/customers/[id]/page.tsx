import { connectDB } from "@/lib/mongoose";
import { getMerchant } from "@/lib/auth";
import { Customer, StampCard, StampRequest } from "@/models";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import StampDisplay from "@/components/stamp-display";
import MerchantCheckin from "@/components/merchant-checkin";
import { generateAnimalName } from "@/lib/animal-names";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const merchant = await getMerchant();
  if (!merchant) redirect("/login");

  const { shop } = merchant;
  await connectDB();

  const customer = await Customer.findById(id);
  if (!customer) notFound();

  const stampCard = await StampCard.findOne({
    shop: shop._id,
    customer: customer._id,
  });

  const requests = await StampRequest.find({
    shop: shop._id,
    customer: customer._id,
    status: { $in: ["approved", "rejected"] },
  })
    .sort({ createdAt: -1 })
    .limit(100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/customers"
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {customer.name || generateAnimalName(customer.cookieId)}
            </h1>
            {customer.email && (
              <p className="text-sm text-muted-foreground">{customer.email}</p>
            )}
          </div>
        </div>
        {stampCard && (
          <MerchantCheckin
            shopId={shop._id.toString()}
            customerId={customer._id.toString()}
            customerName={customer.name || generateAnimalName(customer.cookieId)}
            stamps={stampCard.stamps}
            threshold={shop.stampThreshold}
          />
        )}
      </div>

      {stampCard && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Stamp Card</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="mx-auto max-w-xs">
              <StampDisplay
                stamps={stampCard.stamps}
                threshold={shop.stampThreshold}
              />
            </div>
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <p className="font-medium text-foreground">{stampCard.stamps}</p>
                <p className="text-muted-foreground">Current</p>
              </div>
              <div>
                <p className="font-medium text-foreground">{stampCard.totalEarned}</p>
                <p className="text-muted-foreground">Total Earned</p>
              </div>
              <div>
                <p className="font-medium text-foreground">{stampCard.freeRedeemed}</p>
                <p className="text-muted-foreground">Free Redeemed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">History</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No history yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Stamps</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req: any) => {
                  const isRedeem = req.redeem;
                  const awarded = req.stampsAwarded || 0;

                  return (
                    <TableRow key={req._id.toString()}>
                      <TableCell className="text-muted-foreground">
                        {new Date(req.createdAt).toLocaleString(undefined, {
                          day: "2-digit",
                          month: "2-digit",
                          year: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell>
                        {isRedeem ? (
                          <Badge variant="outline" className="border-amber-500/50 text-amber-500">
                            Redeem
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            Stamp
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {req.status === "approved" ? (
                          isRedeem && awarded === 0 ? (
                            <span className="text-muted-foreground">-{shop.stampThreshold}</span>
                          ) : isRedeem && awarded > 0 ? (
                            <span>
                              <span className="text-muted-foreground">-{shop.stampThreshold}</span>
                              {" "}
                              <span className="text-amber-500">+{awarded}</span>
                            </span>
                          ) : (
                            <span className="text-amber-500">+{awarded}</span>
                          )
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={
                            req.status === "approved"
                              ? "default"
                              : "destructive"
                          }
                        >
                          {req.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
