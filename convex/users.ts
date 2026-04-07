import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getUserByWorkosId, isAdminEmail } from "./_utils";

export const getByWorkosId = query({
  args: { workosUserId: v.string() },
  handler: async (ctx, args) => {
    return await getUserByWorkosId(ctx, args.workosUserId);
  },
});

export const upsertFromWorkOS = mutation({
  args: {
    workosUserId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await getUserByWorkosId(ctx, args.workosUserId);
    const role = isAdminEmail(args.email) ? "admin" : "user";

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        name: args.name,
        avatarUrl: args.avatarUrl,
        role,
      });
      return { ...existing, email: args.email, name: args.name, avatarUrl: args.avatarUrl, role };
    }

    const id = await ctx.db.insert("users", {
      workosUserId: args.workosUserId,
      email: args.email,
      name: args.name,
      avatarUrl: args.avatarUrl,
      role,
    });

    return {
      _id: id,
      workosUserId: args.workosUserId,
      email: args.email,
      name: args.name,
      avatarUrl: args.avatarUrl,
      role,
    };
  },
});

export const isAdmin = query({
  args: { workosUserId: v.string() },
  handler: async (ctx, args) => {
    const user = await getUserByWorkosId(ctx, args.workosUserId);
    return user?.role === "admin";
  },
});
