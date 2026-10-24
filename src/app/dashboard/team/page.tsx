import { PageHeader } from "@/components/page-header";
import TeamClient from "./team-client";

export default function TeamPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Team"
        description="Invite managers and staff to accept stamps on the counter and view customer data."
      />
      <TeamClient />
    </div>
  );
}
