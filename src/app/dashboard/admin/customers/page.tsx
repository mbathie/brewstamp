import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import CustomersClient from "./customers-client";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "mbathie@gmail.com";

export const metadata = { title: "Customers — Admin" };

export default async function AdminCustomersPage() {
  const session = await auth();
  if (session?.user?.email !== ADMIN_EMAIL) redirect("/dashboard");
  return <CustomersClient />;
}
