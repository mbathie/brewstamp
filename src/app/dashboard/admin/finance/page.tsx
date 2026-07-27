import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import FinanceClient from "./finance-client";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "mbathie@gmail.com";

export const metadata = { title: "Finance — Admin" };

export default async function AdminFinancePage() {
  const session = await auth();
  if (session?.user?.email !== ADMIN_EMAIL) redirect("/dashboard");
  return <FinanceClient />;
}
