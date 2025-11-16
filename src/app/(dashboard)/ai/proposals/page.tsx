import { ProposalForm } from "@/components/forms/proposal-form";
import { getClients, getCurrentUserProfile } from "@/lib/data-service";
import { canAccess } from "@/lib/permissions";
import Link from "next/link";

export default async function ProposalStudioPage() {
  const [clients, user] = await Promise.all([getClients(), getCurrentUserProfile()]);
  const canUseAI = user ? canAccess(user.role, "ai", "create") : false;
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-zinc-500">OpenAI powered co-creation</p>
        <h1 className="text-2xl font-semibold text-zinc-900">AI Proposal Studio</h1>
      </div>
      {canUseAI ? (
        <ProposalForm clients={clients} />
      ) : (
        <div className="rounded-2xl border border-zinc-100 bg-white p-6 text-sm text-zinc-600">
          Your role does not have access to AI tooling. Please contact an admin.
          <Link href="/dashboard" className="ml-2 text-emerald-600 hover:underline">
            Back to dashboard
          </Link>
        </div>
      )}
    </div>
  );
}
