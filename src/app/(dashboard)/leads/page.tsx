import { getLeads, getCurrentUserProfile } from "@/lib/data-service";
import { canAccess } from "@/lib/permissions";
import { LeadPipelineBoard } from "@/components/leads/lead-pipeline";

export default async function LeadsPage() {
  const [leads, user] = await Promise.all([getLeads(), getCurrentUserProfile()]);
  const canEditLeads = user ? canAccess(user.role, "leads", "create") : false;
  const canConvert = user ? canAccess(user.role, "leads", "update") : false;
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-zinc-500">Manage new conversations</p>
        <h1 className="text-2xl font-semibold text-zinc-900">Leads pipeline</h1>
      </div>
      <LeadPipelineBoard leads={leads} canEdit={canEditLeads} canConvert={canConvert} />
    </div>
  );
}
