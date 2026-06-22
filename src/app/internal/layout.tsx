import { notFound } from "next/navigation";

// Everything under /internal/* is dev-only. In a production build NODE_ENV is
// "production", so this 404s the whole segment — the pages never render or
// serve in prod (the content is internal/competitive and shouldn't be public).
export const dynamic = "force-dynamic";

export default function InternalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="mx-auto max-w-5xl px-6 py-10">{children}</div>
    </div>
  );
}
