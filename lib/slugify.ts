/**
 * Generate a URL-friendly slug from a product name.
 * Appends the Convex document ID for reliable lookup.
 *
 * Example: "Mazda 787B (Pop Race)" + "k57abc" → "mazda-787b-pop-race-k57abc"
 */
export function productSlug(name: string, id: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${base}-${id}`;
}

/**
 * Extract the Convex document ID from a product slug.
 * The ID is always the last segment after the final hyphen-delimited Convex ID.
 * Convex IDs are alphanumeric and typically look like "k57abc123def456".
 */
export function idFromSlug(slug: string): string {
  // Convex IDs are the last path segment after the last occurrence of the name part.
  // Since product names can contain hyphens, we need to try progressively shorter suffixes.
  // Convex document IDs for "products" table are like "k57..." (variable length).
  // We split on '-' and try the last N segments as potential ID.
  const parts = slug.split('-');
  // The ID is the last part (we appended it in productSlug)
  return parts[parts.length - 1];
}
