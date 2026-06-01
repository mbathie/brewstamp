import { Users } from "lucide-react";
import TeamClient from "./team-client";

export default function TeamPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Team
          </h1>
          <p className="text-sm text-muted-foreground">
            Invite managers and staff to accept stamps on the counter and
            view customer data.
          </p>
        </div>
      </div>
      <TeamClient />
    </div>
  );
}
