import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

const ADMIN_EMAILS = new Set([
  "diecastrs1@gmail.com",
  "rakuteninsi3@gmail.com",
  "nightmareplayz15@gmail.com",
]);

// Minimal context typing to avoid tight coupling with generated types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ConvexContext = any;

export function isAdminEmail(email: string) {
  return ADMIN_EMAILS.has(email.toLowerCase());
}

export async function getUserByWorkosId(ctx: ConvexContext, workosUserId: string) {
  return await ctx.db
    .query("users")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex("by_workosUserId", (q: any) => q.eq("workosUserId", workosUserId))
    .unique();
}

export async function resolveUser(ctx: ConvexContext, workosUserId?: string) {
  const identity = (await ctx.auth?.getUserIdentity?.()) ?? null;
  const identitySubject = identity?.subject ?? identity?.sub ?? null;
  const effectiveWorkosId = identitySubject || workosUserId || null;
  if (!effectiveWorkosId) {
    return null;
  }
  return await getUserByWorkosId(ctx, effectiveWorkosId);
}

export async function requireUser(ctx: ConvexContext, workosUserId?: string) {
  const user = await resolveUser(ctx, workosUserId);
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user as { _id: Id<"users">; role: "admin" | "user"; email: string };
}

export async function requireAdmin(ctx: ConvexContext, workosUserId?: string) {
  const user = await requireUser(ctx, workosUserId);
  if (user.role !== "admin") {
    throw new Error("Forbidden");
  }
  return user;
}
