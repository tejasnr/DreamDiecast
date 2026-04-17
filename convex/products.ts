import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./_utils";
import type { DatabaseReader } from "./_generated/server";

function generateSlugBase(name: string, brand: string, scale: string): string {
  return `${brand}-${name}-${scale}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uniqueSlug(
  db: DatabaseReader,
  base: string,
  excludeId?: string
): Promise<string> {
  let candidate = base;
  let suffix = 2;
  while (true) {
    const existing = await db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", candidate))
      .first();
    if (!existing || existing._id === excludeId) return candidate;
    candidate = `${base}-${suffix}`;
    suffix++;
  }
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    return products.map((p) => ({ ...p, id: p._id }));
  },
});

export const getById = query({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.id);
    if (!product) return null;
    return { ...product, id: product._id };
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    // Primary: indexed lookup by stored slug
    const product = await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (product) {
      if (product.status === "unlisted") return null;
      return { ...product, id: product._id };
    }

    // Fallback: match products that haven't been backfilled yet
    // by regenerating slug from their name/brand/scale
    const all = await ctx.db.query("products").collect();
    const match = all.find((p) => {
      const generated = `${p.brand}-${p.name}-${p.scale}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      return generated === args.slug;
    });
    if (!match || match.status === "unlisted") return null;
    return { ...match, id: match._id };
  },
});

export const create = mutation({
  args: {
    workosUserId: v.optional(v.string()),
    name: v.string(),
    price: v.number(),
    image: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    category: v.string(),
    brand: v.string(),
    scale: v.string(),
    description: v.optional(v.string()),
    stock: v.optional(v.number()),
    rating: v.optional(v.number()),
    details: v.optional(
      v.object({
        type: v.optional(v.string()),
        features: v.optional(v.array(v.string())),
      })
    ),
    sku: v.optional(v.string()),
    condition: v.optional(v.string()),
    type: v.optional(v.string()),
    specialFeatures: v.optional(v.string()),
    listingType: v.optional(v.string()),
    status: v.optional(v.string()),
    isPreorder: v.optional(v.boolean()),
    bookingAdvance: v.optional(v.number()),
    totalFinalPrice: v.optional(v.number()),
    eta: v.optional(v.string()),
    isHype: v.optional(v.boolean()),
    allocatedStock: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.workosUserId);
    const { workosUserId: _ignore, ...payload } = args;
    // Set cover image from first image in array
    if (payload.images?.length && !payload.image) {
      payload.image = payload.images[0];
    }
    // Auto-generate SEO-friendly slug
    const slugBase = generateSlugBase(payload.name, payload.brand, payload.scale);
    const slug = await uniqueSlug(ctx.db, slugBase);
    return await ctx.db.insert("products", { ...payload, slug });
  },
});

export const update = mutation({
  args: {
    workosUserId: v.optional(v.string()),
    id: v.id("products"),
    name: v.optional(v.string()),
    price: v.optional(v.number()),
    image: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    category: v.optional(v.string()),
    brand: v.optional(v.string()),
    scale: v.optional(v.string()),
    description: v.optional(v.string()),
    stock: v.optional(v.number()),
    rating: v.optional(v.number()),
    details: v.optional(
      v.object({
        type: v.optional(v.string()),
        features: v.optional(v.array(v.string())),
      })
    ),
    sku: v.optional(v.string()),
    condition: v.optional(v.string()),
    type: v.optional(v.string()),
    specialFeatures: v.optional(v.string()),
    listingType: v.optional(v.string()),
    status: v.optional(v.string()),
    isPreorder: v.optional(v.boolean()),
    bookingAdvance: v.optional(v.number()),
    totalFinalPrice: v.optional(v.number()),
    eta: v.optional(v.string()),
    isHype: v.optional(v.boolean()),
    allocatedStock: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.workosUserId);
    const { id, workosUserId: _ignore, ...patch } = args;
    // Set cover image from first image in array
    if (patch.images?.length) {
      patch.image = patch.images[0];
    }
    // Regenerate slug if name, brand, or scale changed
    if (patch.name || patch.brand || patch.scale) {
      const existing = await ctx.db.get(id);
      if (existing) {
        const name = patch.name ?? existing.name;
        const brand = patch.brand ?? existing.brand;
        const scale = patch.scale ?? existing.scale;
        const slugBase = generateSlugBase(name, brand, scale);
        (patch as any).slug = await uniqueSlug(ctx.db, slugBase, id);
      }
    }
    await ctx.db.patch(id, patch);
    return id;
  },
});

export const remove = mutation({
  args: { workosUserId: v.optional(v.string()), id: v.id("products") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.workosUserId);
    await ctx.db.delete(args.id);
  },
});

export const getByBrand = query({
  args: { brand: v.string() },
  handler: async (ctx, args) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_brand", (q) => q.eq("brand", args.brand))
      .collect();
    return products
      .filter((p) => p.status !== "unlisted")
      .map((p) => ({ ...p, id: p._id }));
  },
});

export const getCountByBrand = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    const counts: Record<string, number> = {};
    for (const p of products) {
      if (p.status === "unlisted") continue;
      counts[p.brand] = (counts[p.brand] || 0) + 1;
    }
    return counts;
  },
});

export const markArrived = mutation({
  args: { workosUserId: v.optional(v.string()), id: v.id("products") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.workosUserId);
    await ctx.db.patch(args.id, { category: "Current Stock" });
  },
});

const TERMINAL_STATUSES = new Set([
  "cancelled",
  "delivered",
  "fully_paid_shipped",
]);

export const updateCampaignStage = mutation({
  args: {
    workosUserId: v.optional(v.string()),
    productId: v.id("products"),
    newStage: v.union(
      v.literal("brand_ordered"),
      v.literal("international_transit"),
      v.literal("customs_processing"),
      v.literal("inventory_ready")
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.workosUserId);

    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error("Product not found");
    if (
      product.listingType !== "pre-order" &&
      product.category !== "Pre-Order" &&
      !product.isPreorder
    ) {
      throw new Error("Product is not a pre-order listing");
    }

    // Update product procurement stage
    const productPatch: Record<string, any> = {
      procurementStage: args.newStage,
    };
    if (args.newStage === "inventory_ready") {
      productPatch.balanceRequestsSent = false;
    }
    await ctx.db.patch(args.productId, productPatch);

    // Map procurement stage to pre-order status
    const mappedStatus =
      args.newStage === "inventory_ready"
        ? "stock_arrived"
        : "waiting_for_stock";

    // Batch-update all active pre-orders for this product
    const preOrders = await ctx.db
      .query("preOrders")
      .withIndex("by_productId", (q) => q.eq("productId", args.productId))
      .collect();

    let updatedCount = 0;
    for (const po of preOrders) {
      if (!TERMINAL_STATUSES.has(po.status)) {
        await ctx.db.patch(po._id, { status: mappedStatus as any });
        updatedCount++;
      }
    }

    return { updatedCount };
  },
});

export const bulkUpdateStatus = mutation({
  args: {
    workosUserId: v.optional(v.string()),
    productIds: v.array(v.id("products")),
    status: v.union(v.literal("active"), v.literal("unlisted")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.workosUserId);
    let updated = 0;
    for (const id of args.productIds) {
      const product = await ctx.db.get(id);
      if (product) {
        await ctx.db.patch(id, { status: args.status });
        updated++;
      }
    }
    return { updated };
  },
});

export const bulkDelete = mutation({
  args: {
    workosUserId: v.optional(v.string()),
    productIds: v.array(v.id("products")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.workosUserId);
    let deleted = 0;
    let skipped = 0;
    for (const id of args.productIds) {
      const product = await ctx.db.get(id);
      if (!product) continue;
      // Check for active pre-orders
      const activePreOrders = await ctx.db
        .query("preOrders")
        .withIndex("by_productId", (q) => q.eq("productId", id))
        .collect();
      const hasActive = activePreOrders.some(
        (po) =>
          po.status !== "cancelled" &&
          po.status !== "delivered" &&
          po.status !== "fully_paid_shipped"
      );
      if (hasActive) {
        skipped++;
        continue;
      }
      await ctx.db.delete(id);
      deleted++;
    }
    return { deleted, skipped };
  },
});

// Real-time stock check for add-to-cart validation
export const checkStock = query({
  args: {
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) return { available: false, stock: 0 };
    return {
      available: product.stock === undefined || product.stock > 0,
      stock: product.stock ?? 0,
      isHype: product.isHype ?? false,
    };
  },
});

// Main brand names that appear on the homepage
const MAIN_BRANDS = ["Hot Wheels", "Bburago", "Mini GT", "Pop Race", "Tarmac Works", "Matchbox"];

export const getOtherBrandsProducts = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    return products
      .filter((p) => !MAIN_BRANDS.includes(p.brand))
      .map((p) => ({ ...p, id: p._id }));
  },
});

// One-time migration: backfill slugs for existing products that don't have one
export const backfillSlugs = mutation({
  args: { workosUserId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.workosUserId);
    const products = await ctx.db.query("products").collect();
    let updated = 0;
    for (const p of products) {
      if (!p.slug) {
        const slugBase = generateSlugBase(p.name, p.brand, p.scale);
        const slug = await uniqueSlug(ctx.db, slugBase, p._id);
        await ctx.db.patch(p._id, { slug });
        updated++;
      }
    }
    return { updated };
  },
});

export const getOtherBrandNames = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    const brandSet = new Set<string>();
    for (const p of products) {
      if (p.status !== "unlisted" && !MAIN_BRANDS.includes(p.brand)) {
        brandSet.add(p.brand);
      }
    }
    return Array.from(brandSet).sort();
  },
});

export const listPreOrderProducts = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    return products
      .filter(
        (p) =>
          p.listingType === "pre-order" ||
          p.category === "Pre-Order" ||
          p.isPreorder === true
      )
      .map((p) => ({ ...p, id: p._id }));
  },
});
