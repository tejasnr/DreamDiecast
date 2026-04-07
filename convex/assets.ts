import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { decodeBase64DataUrl } from "./_storage";
import { requireAdmin } from "./_utils";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("assets").order("desc").collect();
  },
});

export const create = mutation({
  args: {
    workosUserId: v.optional(v.string()),
    name: v.string(),
    type: v.union(v.literal("image"), v.literal("video")),
    url: v.optional(v.string()),
    dataUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.workosUserId);
    let finalUrl = args.url;
    let storageId: string | undefined;

    if (args.dataUrl) {
      const { bytes, contentType } = decodeBase64DataUrl(args.dataUrl);
      const stored = await ctx.storage.store(new Blob([bytes], { type: contentType }));
      storageId = stored;
      finalUrl = await ctx.storage.getUrl(stored);
    }

    if (!finalUrl) {
      throw new Error("No asset URL provided");
    }

    return await ctx.db.insert("assets", {
      name: args.name,
      url: finalUrl,
      storageId,
      type: args.type,
    });
  },
});

export const remove = mutation({
  args: { workosUserId: v.optional(v.string()), id: v.id("assets") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.workosUserId);
    const asset = await ctx.db.get(args.id);
    if (!asset) return;
    if (asset.storageId) {
      await ctx.storage.delete(asset.storageId);
    }
    await ctx.db.delete(args.id);
  },
});
