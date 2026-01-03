"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { orderUpdateSchema } from "@/lib/validation";
import type { Order } from "@/lib/types";
import { STATUS_COLORS, cn, currencyFormatter, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { updateOrder, type OrderUpdateValues } from "@/actions/orders";

const paymentStatuses = ["pending_payment", "paid", "failed", "refunded"] as const;
const orderStatuses = ["submitted", "processing", "completed", "cancelled"] as const;
const deliveryStatuses = ["not_shipped", "in_transit", "out_for_delivery", "delivered", "cancelled"] as const;

function formatStatusLabel(value?: string) {
  if (!value) return "Not set";
  return value
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function statusClass(value?: string) {
  const label = formatStatusLabel(value);
  return STATUS_COLORS[label] ?? "bg-slate-100 text-slate-700";
}

function toDateInput(value?: string) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function buildFormDefaults(order: Order): OrderUpdateValues {
  return {
    id: order.id,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail ?? "",
    shippingAddressLine1: order.shippingAddressLine1,
    shippingAddressLine2: order.shippingAddressLine2 ?? "",
    city: order.city,
    state: order.state,
    pincode: order.pincode,
    landmark: order.landmark ?? "",
    adminNotes: order.adminNotes ?? "",
    paymentStatus: order.paymentStatus ?? "pending_payment",
    status: order.status ?? "submitted",
    deliveryStatus: order.deliveryStatus ?? "not_shipped",
    expectedDeliveryDate: toDateInput(order.expectedDeliveryDate),
    trackingLink: order.trackingLink ?? "",
  };
}

function includeCurrentOption(options: readonly string[], current?: string) {
  if (!current || options.includes(current)) return options;
  return [current, ...options];
}

export function DropShippingWorkspace({
  orders,
  canEdit,
}: {
  orders: Order[];
  canEdit: boolean;
}) {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(
    orders[0]?.id ?? null,
  );
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === "all" ||
        formatStatusLabel(order.status).toLowerCase() === formatStatusLabel(statusFilter).toLowerCase();
      const matchesPayment =
        paymentStatusFilter === "all" ||
        formatStatusLabel(order.paymentStatus).toLowerCase() ===
          formatStatusLabel(paymentStatusFilter).toLowerCase();
      const matchesSearch = term.length === 0 || (order.orderNumber ?? order.id).toLowerCase().includes(term);
      return matchesStatus && matchesPayment && matchesSearch;
    });
  }, [orders, paymentStatusFilter, search, statusFilter]);

  const selectedOrder = useMemo(
    () => filteredOrders.find((order) => order.id === selectedOrderId) ?? null,
    [filteredOrders, selectedOrderId],
  );

  const form = useForm<OrderUpdateValues>({
    resolver: zodResolver(orderUpdateSchema),
    defaultValues: selectedOrder ? buildFormDefaults(selectedOrder) : undefined,
  });

  useEffect(() => {
    if (selectedOrder) {
      form.reset(buildFormDefaults(selectedOrder));
    }
  }, [selectedOrder, form]);

  useEffect(() => {
    if (filteredOrders.length === 0) {
      setSelectedOrderId(null);
      return;
    }
    const exists = filteredOrders.some((order) => order.id === selectedOrderId);
    if (!exists) {
      setSelectedOrderId(filteredOrders[0]?.id ?? null);
    }
  }, [filteredOrders, selectedOrderId]);

  const onSubmit = (values: OrderUpdateValues) => {
    if (!selectedOrder) return;
    startTransition(async () => {
      const trimmed: OrderUpdateValues = {
        ...values,
        customerName: values.customerName.trim(),
        customerPhone: values.customerPhone.trim(),
        customerEmail: values.customerEmail?.trim() || undefined,
        shippingAddressLine1: values.shippingAddressLine1.trim(),
        shippingAddressLine2: values.shippingAddressLine2?.trim() || undefined,
        city: values.city.trim(),
        state: values.state.trim(),
        pincode: values.pincode.trim(),
        landmark: values.landmark?.trim() || undefined,
        adminNotes: values.adminNotes?.trim() || undefined,
        paymentStatus: values.paymentStatus?.trim() || undefined,
        status: values.status?.trim() || undefined,
        deliveryStatus: values.deliveryStatus?.trim() || undefined,
        expectedDeliveryDate: values.expectedDeliveryDate?.trim() || undefined,
        trackingLink: values.trackingLink?.trim() || undefined,
      };
      const result = await updateOrder(trimmed);
      if (!result.success) {
        toast.error(result.message ?? "Unable to update order");
        return;
      }
      toast.success("Order updated");
    });
  };

  if (!orders.length) {
    return (
      <div className="card p-6">
        <p className="text-sm text-[var(--color-muted)]">No orders available yet.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(320px,360px)_1fr]">
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/70 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label>Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="mt-1"
                >
                  <option value="all">All statuses</option>
                  {orderStatuses.map((status) => (
                    <option key={status} value={status}>
                      {formatStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Payment status</label>
                <select
                  value={paymentStatusFilter}
                  onChange={(e) => setPaymentStatusFilter(e.target.value)}
                  className="mt-1"
                >
                  <option value="all">All payment statuses</option>
                  {paymentStatuses.map((status) => (
                    <option key={status} value={status}>
                      {formatStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label>Search by order number</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mt-1"
                placeholder="e.g., ORD-1001"
              />
            </div>
          </div>
        </div>

        {filteredOrders.map((order) => {
          const isSelected = order.id === selectedOrder?.id;
          const total = order.totalAmountInr ?? (order.unitPriceInr ?? 0) * (order.quantity ?? 0);
          return (
            <button
              key={order.id}
              type="button"
              onClick={() => setSelectedOrderId(order.id)}
              className={cn(
                "w-full rounded-2xl border px-4 py-3 text-left transition-all",
                isSelected
                  ? "border-[var(--color-primary)] bg-white shadow-[0_18px_35px_rgba(37,99,235,0.12)]"
                  : "border-white/70 bg-white/70 hover:border-[var(--color-border-strong)] hover:bg-white",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-foreground)]">
                    {order.orderNumber ?? order.id}
                  </p>
                  <p className="text-xs text-[var(--color-muted)]">{order.customerName}</p>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <span className={cn("chip px-2 py-1 text-[11px]", statusClass(order.status))}>
                    {formatStatusLabel(order.status)}
                  </span>
                  <span
                    className={cn(
                      "chip px-2 py-1 text-[11px]",
                      statusClass(order.paymentStatus ?? "Pending Payment"),
                    )}
                  >
                    {formatStatusLabel(order.paymentStatus ?? "Pending Payment")}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--color-muted)]">
                <span>{currencyFormatter(total, "INR")}</span>
                <span className="h-1 w-1 rounded-full bg-[var(--color-border-strong)]" />
                <span>Qty {order.quantity ?? 0}</span>
                <span className="h-1 w-1 rounded-full bg-[var(--color-border-strong)]" />
                <span>{formatDate(order.createdAt)}</span>
              </div>
            </button>
          );
        })}
        {filteredOrders.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[var(--color-border-strong)] bg-white/60 px-4 py-6 text-center text-sm text-[var(--color-muted)]">
            No orders match your filters.
          </div>
        )}
      </div>

      {selectedOrder ? (
        <div className="card space-y-6 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-muted)]">Drop Shipping</p>
              <h2 className="text-2xl font-semibold text-[var(--color-foreground)]">
                {selectedOrder.orderNumber ?? selectedOrder.id}
              </h2>
              <p className="text-xs text-[var(--color-muted)]">
                Created {formatDate(selectedOrder.createdAt)}
              </p>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <span className={cn("chip px-3 py-1", statusClass(selectedOrder.status))}>
                {formatStatusLabel(selectedOrder.status)}
              </span>
              <span className={cn("chip px-3 py-1", statusClass(selectedOrder.paymentStatus))}>
                {formatStatusLabel(selectedOrder.paymentStatus)}
              </span>
              {selectedOrder.deliveryStatus ? (
                <span className={cn("chip px-3 py-1", statusClass(selectedOrder.deliveryStatus))}>
                  {formatStatusLabel(selectedOrder.deliveryStatus)}
                </span>
              ) : null}
            </div>
          </div>

          {!canEdit && (
            <p className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              You have read-only access. Request elevated permissions to edit shipping details.
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/70 bg-[var(--color-surface-muted)]/60 p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-[var(--color-muted)]">Product</p>
              <p className="text-sm font-semibold text-[var(--color-foreground)]">
                {selectedOrder.productName ?? "Not provided"}
              </p>
              <p className="text-xs text-[var(--color-muted)]">ID: {selectedOrder.productId ?? "—"}</p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-[var(--color-surface-muted)]/60 p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-[var(--color-muted)]">Quantity</p>
              <p className="text-lg font-semibold text-[var(--color-foreground)]">
                {selectedOrder.quantity ?? 0}
              </p>
              <p className="text-xs text-[var(--color-muted)]">
                Unit price {currencyFormatter(selectedOrder.unitPriceInr ?? 0, "INR")}
              </p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-[var(--color-surface-muted)]/60 p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-[var(--color-muted)]">Total</p>
              <p className="text-lg font-semibold text-[var(--color-foreground)]">
                {currencyFormatter(
                  selectedOrder.totalAmountInr ??
                    (selectedOrder.unitPriceInr ?? 0) * (selectedOrder.quantity ?? 0),
                  "INR",
                )}
              </p>
              <p className="text-xs text-[var(--color-muted)]">
                Provider: {selectedOrder.paymentProvider ?? "—"}
              </p>
            </div>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-[var(--color-foreground)]">
                  Customer & Shipping (editable)
                </h3>
                <div className="grid gap-3">
                  <div>
                    <label>Customer name</label>
                    <input
                      {...form.register("customerName")}
                      disabled={!canEdit}
                      className="mt-1"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label>Phone</label>
                      <input {...form.register("customerPhone")} disabled={!canEdit} className="mt-1" />
                    </div>
                    <div>
                      <label>Email</label>
                      <input
                        type="email"
                        {...form.register("customerEmail")}
                        disabled={!canEdit}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <label>Address line 1</label>
                    <input
                      {...form.register("shippingAddressLine1")}
                      disabled={!canEdit}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label>Address line 2</label>
                    <input
                      {...form.register("shippingAddressLine2")}
                      disabled={!canEdit}
                      className="mt-1"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label>City</label>
                      <input {...form.register("city")} disabled={!canEdit} className="mt-1" />
                    </div>
                    <div>
                      <label>State</label>
                      <input {...form.register("state")} disabled={!canEdit} className="mt-1" />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label>Pincode</label>
                      <input {...form.register("pincode")} disabled={!canEdit} className="mt-1" />
                    </div>
                    <div>
                      <label>Landmark</label>
                      <input {...form.register("landmark")} disabled={!canEdit} className="mt-1" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-[var(--color-foreground)]">
                  Admin & Status (editable)
                </h3>
                <div className="grid gap-3">
                  <div>
                    <label>Admin notes</label>
                    <textarea
                      {...form.register("adminNotes")}
                      disabled={!canEdit}
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label>Payment status</label>
                      <select
                        {...form.register("paymentStatus")}
                        disabled={!canEdit}
                        className="mt-1"
                      >
                        {includeCurrentOption(paymentStatuses, selectedOrder.paymentStatus).map((status) => (
                          <option key={status} value={status}>
                            {formatStatusLabel(status)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label>Order status</label>
                      <select {...form.register("status")} disabled={!canEdit} className="mt-1">
                        {includeCurrentOption(orderStatuses, selectedOrder.status).map((status) => (
                          <option key={status} value={status}>
                            {formatStatusLabel(status)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label>Delivery status</label>
                      <select
                        {...form.register("deliveryStatus")}
                        disabled={!canEdit}
                        className="mt-1"
                      >
                        {includeCurrentOption(deliveryStatuses, selectedOrder.deliveryStatus).map((status) => (
                          <option key={status} value={status}>
                            {formatStatusLabel(status)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label>Expected delivery</label>
                      <input
                        type="date"
                        {...form.register("expectedDeliveryDate")}
                        disabled={!canEdit}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <label>Tracking link</label>
                    <input
                      {...form.register("trackingLink")}
                      disabled={!canEdit}
                      className="mt-1"
                      placeholder="https://"
                    />
                  </div>
                </div>
              </div>
            </div>

            {canEdit ? (
              <div className="flex justify-end">
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saving..." : "Save updates"}
                </Button>
              </div>
            ) : null}
          </form>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[var(--color-foreground)]">
              Read-only metadata
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label>Payment link</label>
                <input value={selectedOrder.paymentLinkUsed ?? ""} disabled className="mt-1" />
              </div>
              <div>
                <label>Customer notes</label>
                <input value={selectedOrder.notes ?? ""} disabled className="mt-1" />
              </div>
              <div>
                <label>Razorpay order ID</label>
                <input value={selectedOrder.razorpayOrderId ?? ""} disabled className="mt-1" />
              </div>
              <div>
                <label>Razorpay payment ID</label>
                <input value={selectedOrder.razorpayPaymentId ?? ""} disabled className="mt-1" />
              </div>
              <div>
                <label>Razorpay signature</label>
                <input value={selectedOrder.razorpaySignature ?? ""} disabled className="mt-1" />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
