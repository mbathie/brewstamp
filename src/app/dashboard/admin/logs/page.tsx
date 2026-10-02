import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import LogsClient from "./logs-client";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "mbathie@gmail.com";

export const metadata = { title: "Server logs — Admin" };

export default async function AdminLogsPage() {
  const session = await auth();
  if (session?.user?.email !== ADMIN_EMAIL) redirect("/dashboard");
  return <LogsClient />;
}
