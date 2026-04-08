import { action, internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { decodeBase64DataUrl } from "./_storage";
import { requireAdmin } from "./_utils";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("assets").order("desc").collect();
  },
});

export const insertAsset = internalMutation({
  args: {
    name: v.string(),
    url: v.string(),
    storageId: v.optional(v.id("_storage")),
    type: v.union(v.literal("image"), v.literal("video")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("assets", {
      name: args.name,
      url: args.url,
      storageId: args.storageId,
      type: args.type,
    });
  },
});

export const create = action({
  args: {
    workosUserId: v.optional(v.string()),
    name: v.string(),
    type: v.union(v.literal("image"), v.literal("video")),
    url: v.optional(v.string()),
    dataUrl: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<string> => {
    await requireAdmin(ctx, args.workosUserId);
    let finalUrl = args.url;
    let storageId: Id<"_storage"> | undefined;

    if (args.dataUrl) {
      const { bytes, contentType } = decodeBase64DataUrl(args.dataUrl);
      const stored = await ctx.storage.store(new Blob([bytes], { type: contentType }));
      storageId = stored;
      finalUrl = (await ctx.storage.getUrl(stored)) ?? undefined;
    }

    if (!finalUrl) {
      throw new Error("No asset URL provided");
    }

    return await ctx.runMutation(internal.assets.insertAsset, {
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
