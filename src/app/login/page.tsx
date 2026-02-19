"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Coffee } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const registered = searchParams.get("registered");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <Card className="w-full border-stone-200 shadow-xl">
      <CardHeader className="px-8 pt-10 pb-0 text-center">
        <Link href="/" className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600">
          <Coffee className="h-5 w-5 text-white" />
        </Link>
        <CardTitle className="text-xl text-stone-900">Sign in to <span className="font-[family-name:var(--font-logo)] tracking-wide">Brewstamp</span></CardTitle>
        {registered ? (
          <p className="text-sm text-green-600">
            Account created! Please sign in.
          </p>
        ) : (
          <p className="text-sm text-stone-500">
            Welcome back. Manage your stamp cards.
          </p>
        )}
      </CardHeader>
      <CardContent className="px-8 pb-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            type="submit"
            className="w-full cursor-pointer bg-amber-600 hover:bg-amber-700"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
          <p className="text-center text-sm text-stone-500">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-amber-700 hover:text-amber-800">
              Register
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <img
        src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1920&q=80&auto=format&fit=crop"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" />
      <Link href="/" className="absolute left-6 top-6 z-20 flex items-center gap-2 text-sm font-medium text-white/80 transition-colors hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>
      <Suspense>
        <div className="relative z-10 w-full max-w-xl">
          <LoginForm />
        </div>
      </Suspense>
    </div>
  );
}
