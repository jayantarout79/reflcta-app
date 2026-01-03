import { ProductWorkspace } from "@/components/products/product-workspace";
import { getCurrentUserProfile, getProducts } from "@/lib/data-service";
import { canAccess } from "@/lib/permissions";

export default async function ProductsPage() {
  const [products, user] = await Promise.all([getProducts(), getCurrentUserProfile()]);
  const canManage =
    user &&
    (canAccess(user.role, "products", "create") ||
      canAccess(user.role, "products", "update") ||
      canAccess(user.role, "products", "delete"));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-[var(--color-muted)]">Product onboarding</p>
          <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">Products</h1>
        </div>
        <p className="text-sm text-[var(--color-muted)]">{products.length} total products</p>
      </div>
      <ProductWorkspace products={products} canManage={Boolean(canManage)} />
    </div>
  );
}
