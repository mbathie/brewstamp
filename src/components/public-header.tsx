import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Coffee } from "lucide-react";

export default function PublicHeader({
  transparent = false,
}: {
  transparent?: boolean;
}) {
  return (
    <header
      className={`${transparent ? "fixed" : "sticky"} top-0 z-50 w-full border-b border-white/10 ${transparent ? "bg-stone-900/60" : "bg-stone-900/95"} backdrop-blur-md`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-600">
            <Coffee className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="font-[family-name:var(--font-logo)] text-2xl tracking-wide text-white">
            Brewstamp
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button
              variant="ghost"
              className="cursor-pointer text-stone-300 hover:bg-white/10 hover:text-white"
            >
              Sign In
            </Button>
          </Link>
          <Link href="/register">
            <Button className="cursor-pointer bg-amber-600 hover:bg-amber-700">
              Get Started Free
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
