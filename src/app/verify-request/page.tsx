import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail } from "lucide-react";

export default function VerifyRequestPage() {
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
      <Card className="relative z-10 w-full max-w-md border-stone-200 text-center shadow-xl">
        <CardHeader className="px-8 pt-10 pb-0">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <Mail className="h-8 w-8 text-amber-600" />
          </div>
          <CardTitle className="text-xl text-stone-900">Check your email</CardTitle>
          <p className="text-sm text-stone-500">
            A sign in link has been sent to your email address.
          </p>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <p className="mb-4 text-sm text-stone-400">
            Click the link in your email to sign in to your account. If you
            don&apos;t see the email, check your spam folder.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-amber-700 hover:text-amber-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
