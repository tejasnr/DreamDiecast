/**
 * Return the SEO-friendly slug for a product.
 *
 * Products now store a `slug` field in the database.
 * If the slug is already stored, return it directly.
 * Otherwise fall back to generating one from brand + name + scale
 * (for products that haven't been backfilled yet).
 */
export function productSlug(product: {
  name: string;
  id: string;
  slug?: string;
  brand?: string;
  scale?: string;
}): string {
  if (product.slug) return product.slug;

  // Fallback for products without a stored slug (pre-migration)
  const parts = [product.brand, product.name, product.scale]
    .filter(Boolean)
    .join('-');
  return parts
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
