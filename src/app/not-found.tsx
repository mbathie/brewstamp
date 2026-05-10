import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Coffee } from "lucide-react";
import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <PublicHeader />
      <main className="flex flex-1 items-center justify-center px-6 py-24">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100">
            <Coffee className="h-8 w-8 text-amber-700" aria-hidden />
          </div>
          <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-amber-700">
            404
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
            Page not found
          </h1>
          <p className="mt-4 text-base leading-relaxed text-stone-500">
            The page you&apos;re looking for doesn&apos;t exist or has moved.
          </p>
          <div className="mt-8">
            <Link href="/">
              <Button
                size="lg"
                className="cursor-pointer bg-amber-700 px-8 text-base hover:bg-amber-800"
              >
                Back to home
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
