import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AdminPartnersClient from "./partners-client";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "mbathie@gmail.com";
export const metadata = { title: "Partners — Admin" };

export default async function AdminPartnersPage() {
  const session = await auth();
  if (session?.user?.email !== ADMIN_EMAIL) redirect("/dashboard");
  return <AdminPartnersClient />;
}
