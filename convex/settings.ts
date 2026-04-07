import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./_utils";

const DEFAULT_SETTINGS = {
  heroBackground: "https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?q=80&w=1920&auto=format&fit=crop",
  vaultImage: "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?q=80&w=1920&auto=format&fit=crop",
  footerBackground: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1920&auto=format&fit=crop",
  categoryJdm: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=800&auto=format&fit=crop",
  categoryEuropean: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=800&auto=format&fit=crop",
  categoryHypercars: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?q=80&w=800&auto=format&fit=crop",
};

export const getWebsite = query({
  args: {},
  handler: async (ctx) => {
    const doc = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "website"))
      .unique();

    if (!doc) {
      return { key: "website", ...DEFAULT_SETTINGS };
    }

    return { ...DEFAULT_SETTINGS, ...doc };
  },
});

export const updateWebsiteSetting = mutation({
  args: {
    workosUserId: v.optional(v.string()),
    key: v.union(
      v.literal("heroBackground"),
      v.literal("vaultImage"),
      v.literal("footerBackground"),
      v.literal("categoryJdm"),
      v.literal("categoryEuropean"),
      v.literal("categoryHypercars")
    ),
    value: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.workosUserId);
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "website"))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { [args.key]: args.value });
      return existing._id;
    }

    return await ctx.db.insert("settings", {
      key: "website",
      ...DEFAULT_SETTINGS,
      [args.key]: args.value,
    });
  },
});
