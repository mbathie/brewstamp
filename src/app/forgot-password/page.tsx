"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Coffee } from "lucide-react";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.get("email") }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  }

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
      <Card className="relative z-10 w-full max-w-xl border-stone-200 shadow-xl">
        <CardHeader className="px-8 pt-10 pb-0 text-center">
          <Link
            href="/"
            className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600"
          >
            <Coffee className="h-5 w-5 text-white" />
          </Link>
          <CardTitle className="text-xl text-stone-900">
            Reset your password
          </CardTitle>
          {sent ? (
            <p className="text-sm text-green-600">
              Check your email for a reset link.
            </p>
          ) : (
            <p className="text-sm text-stone-500">
              Enter your email and we&apos;ll send you a reset link.
            </p>
          )}
        </CardHeader>
        <CardContent className="px-8 pb-8">
          {sent ? (
            <div className="space-y-5 pt-2">
              <p className="text-center text-sm text-stone-500">
                If an account exists with that email, you&apos;ll receive a
                password reset link shortly.
              </p>
              <Link href="/login">
                <Button className="w-full cursor-pointer bg-amber-600 hover:bg-amber-700">
                  Back to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button
                type="submit"
                className="w-full cursor-pointer bg-amber-600 hover:bg-amber-700"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
              <p className="text-center text-sm text-stone-500">
                Remember your password?{" "}
                <Link
                  href="/login"
                  className="font-medium text-amber-700 hover:text-amber-800"
                >
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
