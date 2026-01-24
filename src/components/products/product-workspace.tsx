"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { productFormSchema } from "@/lib/validation";
import type { Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn, currencyFormatter, formatDate } from "@/lib/utils";
import {
  deleteProduct,
  deleteProductImage,
  type ProductFormValues,
  upsertProduct,
  uploadProductImage,
} from "@/actions/products";
import { useRouter } from "next/navigation";

type SlotKey = "imagePath" | "imagePath2" | "imagePath3";

function buildDefaults(product?: Product): ProductFormValues {
  return {
    id: product?.id,
    externalProductId: product?.externalProductId ?? "",
    name: product?.name ?? "",
    subtitle: product?.subtitle ?? "",
    productType: product?.productType ?? "",
    designSku: product?.designSku ?? "",
    baseSku: product?.baseSku ?? "",
    imagePath: product?.imagePath ?? "",
    imagePath2: product?.imagePath2 ?? "",
    imagePath3: product?.imagePath3 ?? "",
    productCost: product?.productCost ?? undefined,
    sellingCost: product?.sellingCost ?? undefined,
    active: product?.active ?? true,
    displayOrder: product?.displayOrder ?? 0,
    productDetails: product?.productDetails ?? "",
    productDisplayName: product?.productDisplayName ?? "",
  };
}

function normalizePayload(values: ProductFormValues): ProductFormValues {
  return {
    ...values,
    productCost: values.productCost === undefined || Number.isNaN(values.productCost) ? undefined : values.productCost,
    sellingCost:
      values.sellingCost === undefined || Number.isNaN(values.sellingCost) ? undefined : values.sellingCost,
    displayOrder:
      values.displayOrder === undefined || Number.isNaN(values.displayOrder) ? 0 : values.displayOrder,
    active: values.active ?? true,
  };
}

export function ProductWorkspace({ products, canManage }: { products: Product[]; canManage: boolean }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(products[0]?.id ?? null);
  const [uploadingSlot, setUploadingSlot] = useState<SlotKey | null>(null);
  const [isPending, startTransition] = useTransition();

  const selected = useMemo(
    () => products.find((product) => product.id === selectedId) ?? null,
    [products, selectedId],
  );

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: buildDefaults(selected ?? undefined),
  });

  useEffect(() => {
    form.reset(buildDefaults(selected ?? undefined));
  }, [selected, form]);

  const handleUpload = async (slot: SlotKey, file: File | null) => {
    if (!file) return;
    setUploadingSlot(slot);
    const fd = new FormData();
    fd.append("file", file);
    const result = await uploadProductImage(fd);
    setUploadingSlot(null);
    if (!result.success || !result.publicUrl) {
      toast.error(result.message ?? "Upload failed");
      return;
    }
    form.setValue(slot, result.publicUrl, { shouldDirty: true });
    await form.trigger(slot);
    if (selected?.id) {
      const values = normalizePayload(form.getValues());
      startTransition(async () => {
        const saveResult = await upsertProduct(values);
        if (!saveResult.success) {
          toast.error(saveResult.message ?? "Unable to save image URL");
          return;
        }
        toast.success("Image URL saved");
        router.refresh();
      });
    } else {
      toast.success("Image uploaded — click Save product to persist");
    }
  };

  const handleDeleteImage = async (slot: SlotKey) => {
    const url = form.getValues(slot);
    if (!url) return;
    const result = await deleteProductImage(url);
    if (!result.success) {
      toast.error(result.message ?? "Unable to delete image");
      return;
    }
    form.setValue(slot, "", { shouldDirty: true });
    toast.success("Image removed");
  };

  const onSubmit = (values: ProductFormValues) => {
    startTransition(async () => {
      const payload = normalizePayload(values);
      const result = await upsertProduct(payload);
      if (!result.success) {
        toast.error(result.message ?? "Unable to save product");
        return;
      }
      toast.success("Product saved");
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!selected?.id) return;
    startTransition(async () => {
      const result = await deleteProduct(selected.id);
      if (!result.success) {
        toast.error(result.message ?? "Unable to delete product");
        return;
      }
      toast.success("Product deleted");
      setSelectedId(products.find((p) => p.id !== selected.id)?.id ?? null);
      router.refresh();
    });
  };

  const setNewProduct = () => {
    setSelectedId(null);
    form.reset(buildDefaults(undefined));
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(320px,360px)_1fr]">
      <div className="space-y-4">
        <Button variant="secondary" fullWidth onClick={setNewProduct} disabled={!canManage}>
          + New product
        </Button>
        <div className="space-y-3">
          {products.map((product) => {
            const isSelected = product.id === selected?.id;
            return (
              <button
                key={product.id}
                type="button"
                onClick={() => setSelectedId(product.id)}
                className={cn(
                  "w-full rounded-2xl border px-4 py-3 text-left transition-all",
                  isSelected
                    ? "border-[var(--color-primary)] bg-white shadow-[0_18px_35px_rgba(37,99,235,0.12)]"
                    : "border-white/70 bg-white/70 hover:border-[var(--color-border-strong)] hover:bg-white",
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 overflow-hidden rounded-xl bg-[var(--color-surface-muted)]">
                    {product.imagePath ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.imagePath} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-[var(--color-muted)]">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[var(--color-foreground)]">
                      {product.productDisplayName ?? product.name}
                    </p>
                    <p className="text-xs text-[var(--color-muted)]">{product.subtitle ?? product.productType ?? "—"}</p>
                    <div className="mt-2 flex items-center gap-2 text-[11px] text-[var(--color-muted)]">
                      <span className={cn("chip px-2 py-1", product.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600")}>
                        {product.active ? "Active" : "Inactive"}
                      </span>
                      {product.sellingCost !== undefined && (
                        <span>{currencyFormatter(product.sellingCost, "INR")}</span>
                      )}
                      {product.createdAt && (
                        <>
                          <span className="h-1 w-1 rounded-full bg-[var(--color-border-strong)]" />
                          <span>{formatDate(product.createdAt)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
          {products.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[var(--color-border-strong)] bg-white/60 px-4 py-6 text-center text-sm text-[var(--color-muted)]">
              No products yet. Create your first product.
            </div>
          )}
        </div>
      </div>

      <div className="card space-y-5 p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-muted)]">Product Onboarding</p>
            <h2 className="text-2xl font-semibold text-[var(--color-foreground)]">
              {selected ? selected.productDisplayName ?? selected.name : "New product"}
            </h2>
            {selected?.baseSku ? (
              <p className="text-xs text-[var(--color-muted)]">Base SKU: {selected.baseSku}</p>
            ) : null}
          </div>
          {selected && canManage ? (
            <Button type="button" variant="danger" size="sm" onClick={handleDelete} disabled={isPending}>
              Delete
            </Button>
          ) : null}
        </div>

        {!canManage && (
          <p className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            You have read-only access. Request edit permissions to manage products.
          </p>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* hidden field to make sure updates carry the product id */}
          <input type="hidden" {...form.register("id")} />
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label>Name</label>
              <input {...form.register("name")} className="mt-1" disabled={!canManage} />
            </div>
            <div>
              <label>Display name</label>
              <input {...form.register("productDisplayName")} className="mt-1" disabled={!canManage} />
            </div>
            <div>
              <label>Subtitle</label>
              <input {...form.register("subtitle")} className="mt-1" disabled={!canManage} />
            </div>
            <div>
              <label>Product type</label>
              <input {...form.register("productType")} className="mt-1" disabled={!canManage} />
            </div>
            <div>
              <label>External product ID</label>
              <input {...form.register("externalProductId")} className="mt-1" disabled={!canManage} />
            </div>
            <div>
              <label>Base SKU</label>
              <input {...form.register("baseSku")} className="mt-1" disabled={!canManage} />
            </div>
            <div>
              <label>Design SKU</label>
              <input {...form.register("designSku")} className="mt-1" disabled={!canManage} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label>Product cost (INR)</label>
                <input
                  type="number"
                  step="0.01"
                  {...form.register("productCost", { valueAsNumber: true })}
                  className="mt-1"
                  disabled={!canManage}
                />
              </div>
              <div>
                <label>Selling cost (INR)</label>
                <input
                  type="number"
                  step="0.01"
                  {...form.register("sellingCost", { valueAsNumber: true })}
                  className="mt-1"
                  disabled={!canManage}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label>Display order</label>
                <input
                  type="number"
                  {...form.register("displayOrder", { valueAsNumber: true })}
                  className="mt-1"
                  disabled={!canManage}
                />
              </div>
              <div className="mt-6 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  {...form.register("active")}
                  disabled={!canManage}
                  className="h-4 w-4"
                />
                <label htmlFor="active" className="!mt-0">
                  Active
                </label>
              </div>
            </div>
          </div>

          <div>
            <label>Product details</label>
            <textarea
              {...form.register("productDetails")}
              className="mt-1"
              rows={4}
              disabled={!canManage}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {(["imagePath", "imagePath2", "imagePath3"] as SlotKey[]).map((slot) => {
              const url = form.watch(slot);
              const label = slot === "imagePath" ? "Image 1" : slot === "imagePath2" ? "Image 2" : "Image 3";
              return (
                <div key={slot} className="space-y-2 rounded-2xl border border-white/70 bg-[var(--color-surface-muted)]/60 p-3">
                  <p className="text-xs font-semibold text-[var(--color-foreground)]">{label}</p>
                  <div className="aspect-[4/3] overflow-hidden rounded-xl bg-white">
                    {url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={url} alt={label} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-[var(--color-muted)]">
                        No image
                      </div>
                    )}
                  </div>
                  {canManage && (
                    <div className="flex flex-col gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleUpload(slot, e.target.files?.[0] ?? null)}
                        disabled={uploadingSlot === slot}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        fullWidth
                        onClick={() => handleDeleteImage(slot)}
                        disabled={!url || uploadingSlot === slot}
                      >
                        Delete
                      </Button>
                      {uploadingSlot === slot && (
                        <p className="text-xs text-[var(--color-muted)]">Uploading...</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {canManage && (
            <div className="flex justify-end gap-3">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save product"}
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
