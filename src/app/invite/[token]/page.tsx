import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Coffee, Mail } from "lucide-react";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import { Invite, Shop, User } from "@/models";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AcceptInviteButton from "./accept-button";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function InviteLandingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  await connectDB();
  const invite = await Invite.findOne({ token })
    .populate("invitedBy", "name email")
    .lean<any>();

  if (!invite) {
    return (
      <CenteredCard title="Invite not found">
        <p className="text-sm text-muted-foreground">
          This invite link is invalid or has already been used. Ask the
          shop owner to send a new invite.
        </p>
      </CenteredCard>
    );
  }

  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
    return (
      <CenteredCard title="Invite expired">
        <p className="text-sm text-muted-foreground">
          This invite was sent to <strong>{invite.email}</strong> but has
          since expired. Ask the shop owner to send a new one.
        </p>
      </CenteredCard>
    );
  }

  if (invite.acceptedAt) {
    return (
      <CenteredCard title="Invite already accepted">
        <p className="text-sm text-muted-foreground">
          You&apos;ve already accepted this invite.{" "}
          <Link href="/dashboard" className="text-amber-500 hover:underline">
            Open your dashboard
          </Link>
          .
        </p>
      </CenteredCard>
    );
  }

  const shop = await Shop.findById(invite.shop);

  const session = await auth();
  // Not signed in → send them to /login (or /register if no account exists
  // for this email yet) with a callback back to this invite page.
  if (!session?.user) {
    const existing = await User.findOne({ email: invite.email });
    const callback = `/invite/${encodeURIComponent(token)}`;
    const target = existing
      ? `/login?callbackUrl=${encodeURIComponent(callback)}`
      : `/register?callbackUrl=${encodeURIComponent(callback)}`;
    redirect(target);
  }

  const userEmail = session.user.email?.toLowerCase();
  const emailMatches = userEmail === invite.email.toLowerCase();

  return (
    <CenteredCard title={`Join ${shop?.name || "this shop"}`}>
      <p className="text-sm text-muted-foreground">
        <strong>{invite.invitedBy?.name || "A teammate"}</strong> invited
        you to <strong>{shop?.name}</strong> as a{" "}
        <strong>{invite.role === "manager" ? "Manager" : "Staff"}</strong>.
      </p>

      {!emailMatches ? (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-300">
          <p className="font-medium">Email mismatch</p>
          <p className="mt-1 text-amber-200/80">
            This invite was sent to{" "}
            <span className="font-mono">{invite.email}</span> but you&apos;re
            signed in as{" "}
            <span className="font-mono">{session.user.email}</span>. Sign
            out and back in with the invited address to accept.
          </p>
          <Link
            href={`/api/auth/signout?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`}
            className="mt-2 inline-block text-amber-300 underline"
          >
            Sign out
          </Link>
        </div>
      ) : (
        <AcceptInviteButton token={token} />
      )}
    </CenteredCard>
  );
}

function CenteredCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="dark min-h-svh bg-background px-6 py-16">
      <div className="mx-auto flex max-w-md flex-col items-center">
        <Link href="/" className="mb-6 flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-700">
            <Coffee className="h-5 w-5 text-white" />
          </div>
          <span className="font-[family-name:var(--font-logo)] text-3xl tracking-wide text-foreground">
            Brewstamp
          </span>
        </Link>
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="size-5 text-amber-500" />
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}
