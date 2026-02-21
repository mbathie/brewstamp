"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Coffee } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirm = formData.get("confirm") as string;

    if (password !== confirm) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      router.push("/login?reset=true");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  if (!token || !email) {
    return (
      <Card className="w-full border-stone-200 shadow-xl">
        <CardHeader className="px-8 pt-10 pb-0 text-center">
          <Link
            href="/"
            className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600"
          >
            <Coffee className="h-5 w-5 text-white" />
          </Link>
          <CardTitle className="text-xl text-stone-900">
            Invalid reset link
          </CardTitle>
          <p className="text-sm text-stone-500">
            This password reset link is invalid or has expired.
          </p>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <div className="space-y-5 pt-2">
            <Link href="/forgot-password">
              <Button className="w-full cursor-pointer bg-amber-600 hover:bg-amber-700">
                Request a new reset link
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full border-stone-200 shadow-xl">
      <CardHeader className="px-8 pt-10 pb-0 text-center">
        <Link
          href="/"
          className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600"
        >
          <Coffee className="h-5 w-5 text-white" />
        </Link>
        <CardTitle className="text-xl text-stone-900">
          Set a new password
        </CardTitle>
        <p className="text-sm text-stone-500">
          Enter your new password below.
        </p>
      </CardHeader>
      <CardContent className="px-8 pb-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm Password</Label>
            <Input
              id="confirm"
              name="confirm"
              type="password"
              required
              minLength={6}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            type="submit"
            className="w-full cursor-pointer bg-amber-600 hover:bg-amber-700"
            disabled={loading}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <img
        src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1920&q=80&auto=format&fit=crop"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" />
      <Link
        href="/"
        className="absolute left-6 top-6 z-20 flex items-center gap-2 text-sm font-medium text-white/80 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>
      <Suspense>
        <div className="relative z-10 w-full max-w-xl">
          <ResetPasswordForm />
        </div>
      </Suspense>
    </div>
  );
}
