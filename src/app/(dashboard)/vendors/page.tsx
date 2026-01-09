import { VendorForm } from "@/components/forms/vendor-form";
import { VendorCardList } from "@/components/vendors/vendor-card-list";
import { getCurrentUserProfile, getVendors } from "@/lib/data-service";
import { canAccess } from "@/lib/permissions";

export default async function VendorsPage() {
  const [vendors, user] = await Promise.all([getVendors(), getCurrentUserProfile()]);
  const canCreate = user ? canAccess(user.role, "vendors", "create") : false;
  const canEdit = user ? canAccess(user.role, "vendors", "update") : false;
  const canDelete = user ? canAccess(user.role, "vendors", "delete") : false;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-[var(--color-muted)]">Supplier onboarding</p>
          <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">Vendors</h1>
        </div>
        <p className="text-sm text-[var(--color-muted)]">{vendors.length} vendors</p>
      </div>
      {canCreate && <VendorForm />}
      <div className="rounded-3xl border border-white/50 bg-white/90 p-5 shadow-sm">
        <VendorCardList vendors={vendors} canEdit={Boolean(canEdit)} canDelete={Boolean(canDelete)} />
      </div>
    </div>
  );
}
