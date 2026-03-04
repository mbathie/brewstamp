"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coffee } from "lucide-react";

export default function SetupPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [shopName, setShopName] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name);
    }
  }, [session]);

  useEffect(() => {
    if ((session?.user as any)?.shopId) {
      router.replace("/dashboard");
    }
  }, [session, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shopName,
        name: name || undefined,
        phone: phone || undefined,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setLoading(false);
      setError(data.error || "Setup failed");
      return;
    }

    // Full page reload to refresh the JWT with the new shopId
    window.location.href = "/dashboard?init=1";
  }

  if (status === "loading" || status === "unauthenticated") {
    return null;
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <img
        src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1920&q=80&auto=format&fit=crop"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" />
      <Card className="relative z-10 w-full max-w-xl border-stone-200 shadow-xl">
        <CardHeader className="px-8 pt-10 pb-0 text-center">
          <Link href="/" className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600">
            <Coffee className="h-5 w-5 text-white" />
          </Link>
          <CardTitle className="text-xl text-stone-900">Set up your shop</CardTitle>
          <p className="text-sm text-stone-500">
            One last step — tell us about your business
          </p>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="shopName">Shop Name</Label>
              <Input
                id="shopName"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g. Bean & Brew"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone Number <span className="text-stone-400 font-normal">(optional)</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              type="submit"
              className="w-full cursor-pointer bg-amber-600 hover:bg-amber-700"
              disabled={loading}
            >
              {loading ? "Setting up..." : "Create Shop"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
