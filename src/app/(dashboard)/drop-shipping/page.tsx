import { DropShippingWorkspace } from "@/components/orders/drop-shipping-workspace";
import { getCurrentUserProfile, getOrders } from "@/lib/data-service";
import { canAccess } from "@/lib/permissions";

function normalize(value?: string) {
  return (value ?? "").toLowerCase();
}

export default async function DropShippingPage() {
  const [orders, user] = await Promise.all([getOrders(), getCurrentUserProfile()]);
  const completedCount = orders.filter(
    (order) =>
      normalize(order.status).includes("complete") ||
      normalize(order.deliveryStatus).includes("deliver"),
  ).length;
  const cancelledCount = orders.filter((order) => normalize(order.status).includes("cancel")).length;
  const pendingCount = Math.max(orders.length - completedCount - cancelledCount, 0);
  const canEditOrders =
    user &&
    (canAccess(user.role, "orders", "update") ||
      canAccess(user.role, "orders", "create") ||
      canAccess(user.role, "orders", "delete"));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-[var(--color-muted)]">Drop shipping cockpit</p>
          <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">Drop Shipping</h1>
        </div>
        <p className="text-sm text-[var(--color-muted)]">{orders.length} total orders</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/70 bg-white p-4 shadow-sm">
          <p className="text-xs text-[var(--color-muted)]">Total orders</p>
          <p className="text-2xl font-semibold text-[var(--color-foreground)]">{orders.length}</p>
        </div>
        <div className="rounded-2xl border border-white/70 bg-white p-4 shadow-sm">
          <p className="text-xs text-[var(--color-muted)]">Completed / Delivered</p>
          <p className="text-2xl font-semibold text-emerald-600">{completedCount}</p>
        </div>
        <div className="rounded-2xl border border-white/70 bg-white p-4 shadow-sm">
          <p className="text-xs text-[var(--color-muted)]">Pending / In progress</p>
          <p className="text-2xl font-semibold text-[var(--color-foreground)]">{pendingCount}</p>
        </div>
        <div className="rounded-2xl border border-white/70 bg-white p-4 shadow-sm">
          <p className="text-xs text-[var(--color-muted)]">Cancelled</p>
          <p className="text-2xl font-semibold text-rose-600">{cancelledCount}</p>
        </div>
      </div>

      <DropShippingWorkspace orders={orders} canEdit={Boolean(canEditOrders)} />
    </div>
  );
}
