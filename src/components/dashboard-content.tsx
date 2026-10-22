"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Download,
  Monitor,
  QrCode,
  Settings as SettingsIcon,
  Smartphone,
  UserPen,
} from "lucide-react";
import DashboardOverview from "@/components/dashboard/overview";

// The single-shop dashboard: the go-live checklist until the shop is running
// for real, then the overview (today, performance, insights).
interface Props {
  shopName: string;
  shopCode: string;
  shopLogo?: string | null;
  stampThreshold: number;
  perkMode?: boolean;
  isNewShop: boolean;
  hasEarnedStamps?: boolean;
  hasActivity?: boolean;
  needsProfileUpdate?: boolean;
  setupComplete?: boolean;
  canManageBilling?: boolean;
}

export default function DashboardContent({
  shopName,
  perkMode = false,
  stampThreshold,
  isNewShop,
  hasEarnedStamps = false,
  hasActivity = false,
  needsProfileUpdate,
  setupComplete = false,
  canManageBilling = false,
}: Props) {
  // Show the welcome / activation card until the shop earns its first stamp.
  const showSetup = isNewShop || !hasEarnedStamps;
  // Customers have been scanning but no stamp has actually been awarded yet.
  const stuckOnActivation = !isNewShop && hasActivity && !hasEarnedStamps;
  // Set up and tested, but not yet running for real customers — reframe the
  // checklist as "go live" rather than "welcome".
  const testedNotLive = isNewShop && hasEarnedStamps;

  return (
    <div className="space-y-6">
      {showSetup ? (
        <div className="space-y-6">
          <Card className="border-amber-600/30 bg-amber-700/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-foreground">
                {stuckOnActivation
                  ? perkMode
                    ? "You're almost there — let's approve your first free reward"
                    : "You're almost there — let's land your first stamp"
                  : testedNotLive
                    ? "You've tested it — now go live"
                    : "Welcome! Let's get you set up"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-6 text-sm text-muted-foreground">
                {stuckOnActivation
                  ? perkMode
                    ? "Staff have started scanning your QR code but no free rewards have been approved yet. Walk through step 4 below to approve your first one."
                    : "Customers have started scanning your QR code but no stamps have been approved yet. Walk through step 4 below to award your first one."
                  : testedNotLive
                    ? perkMode
                      ? "Your perk is set up and tested. Put your QR code where staff can scan it to start serving free rewards for real."
                      : "Your card is set up and tested. Put your QR code on the counter to start collecting stamps from real customers."
                    : perkMode
                      ? "Follow these four steps to start serving free rewards to your staff."
                      : "Follow these four steps to start collecting stamps from your customers."}
              </p>
              <div className="space-y-5">
                {needsProfileUpdate && (
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-600/30 bg-amber-700/10 text-sm font-bold text-amber-700">
                      <UserPen className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">
                          Complete your profile
                        </p>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Add your name and contact info in{" "}
                        <Link
                          href="/dashboard/settings"
                          className="font-medium text-amber-700 hover:underline"
                        >
                          Shop Setup
                        </Link>{" "}
                        so customers know who you are.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-700 text-sm font-bold text-white">
                    1
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Download className="h-4 w-4 text-amber-700" />
                      <p className="font-medium text-foreground">
                        Show your QR code — print it, or use your screen
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      <strong className="text-foreground">No printer?</strong>{" "}
                      Tap{" "}
                      <span className="font-medium text-amber-700">Show QR</span>{" "}
                      in the top bar to fill your screen with the code, then flip
                      your laptop or tablet around so the customer can scan it —
                      no printout needed. Prefer paper? Go to{" "}
                      <Link
                        href="/dashboard/settings"
                        className="font-medium text-amber-700 hover:underline"
                      >
                        Shop Setup
                      </Link>{" "}
                      to download a printable PDF and place it at the register or
                      on the counter.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-700 text-sm font-bold text-white">
                    2
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-amber-700" />
                      <p className="font-medium text-foreground">
                        Stay logged in at the point of sale
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Keep this dashboard open on a device at your counter — a
                      tablet, laptop, or phone. When a customer scans the QR
                      code, a {perkMode ? "free-coffee" : "stamp"} request will
                      pop up here for you to approve in real-time.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-700 text-sm font-bold text-white">
                    3
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <QrCode className="h-4 w-4 text-amber-700" />
                      <p className="font-medium text-foreground">
                        Customers scan &amp; you approve
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Customers simply point their phone camera at the QR code —
                      no app download or account needed. You&apos;ll see a
                      request instantly on your dashboard and can approve it
                      with one tap.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-700 text-sm font-bold text-white">
                    4
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-amber-700" />
                      <p className="font-medium text-foreground">
                        Try it yourself right now
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Don&apos;t wait for a real customer — test the flow now so
                      you know what to expect. Open the QR code from{" "}
                      <Link
                        href="/dashboard/settings"
                        className="font-medium text-amber-700 hover:underline"
                      >
                        Shop Setup
                      </Link>{" "}
                      on this device, point your phone&apos;s camera at the
                      screen, complete the customer flow on your phone, then
                      come back here and approve the{" "}
                      {perkMode ? "free-coffee" : "stamp"} request when it
                      appears. Once you&apos;ve done it once, you&apos;ll never
                      second-guess a real one.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Link href="/dashboard/settings">
                  <Button className="cursor-pointer bg-amber-700 hover:bg-amber-800">
                    <Download className="mr-2 h-4 w-4" />
                    {stuckOnActivation
                      ? "Open your QR code"
                      : "Go to Shop Setup to download your QR code"}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {!setupComplete && (
            <Card className="border-amber-600/30 bg-amber-700/5">
              <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div className="flex items-center gap-3">
                  <SettingsIcon className="h-5 w-5 text-amber-700" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Make your loyalty card yours
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Add your logo and pick brand colors so the customer card
                      matches your shop.
                    </p>
                  </div>
                </div>
                <Link href="/dashboard/settings">
                  <Button
                    size="sm"
                    className="cursor-pointer bg-amber-700 hover:bg-amber-800"
                  >
                    Open Shop Setup
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
          <DashboardOverview
            shopName={shopName}
            perkMode={perkMode}
            stampThreshold={stampThreshold}
            canManageBilling={canManageBilling}
          />
        </>
      )}
    </div>
  );
}
