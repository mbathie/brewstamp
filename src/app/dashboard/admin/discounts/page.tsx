import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import DiscountsClient from "./discounts-client";

const ADMIN_EMAIL = "mbathie@gmail.com";

export default async function AdminDiscountsPage() {
  const session = await auth();
  if (session?.user?.email !== ADMIN_EMAIL) redirect("/dashboard");
  return <DiscountsClient />;
}
