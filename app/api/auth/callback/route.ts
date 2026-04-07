import { NextRequest, NextResponse } from "next/server";
import { workos, clientId } from "@/lib/workos";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { cookies } from "next/headers";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/?error=no_code", request.url));
  }

  try {
    const { user, accessToken } =
      await workos.userManagement.authenticateWithCode({
        code,
        clientId,
      });

    // Upsert user in Convex
    const convexUser = await convex.mutation(api.users.upsertFromWorkOS, {
      workosUserId: user.id,
      email: user.email,
      name:
        [user.firstName, user.lastName].filter(Boolean).join(" ") || undefined,
      avatarUrl: user.profilePictureUrl || undefined,
    });

    // Build session payload
    const session = JSON.stringify({
      accessToken,
      workosUserId: user.id,
      convexUserId: convexUser._id,
      email: user.email,
      name: convexUser.name || null,
      avatarUrl: convexUser.avatarUrl || null,
      role: convexUser.role,
    });

    const cookieStore = await cookies();
    cookieStore.set("wos_session", session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return NextResponse.redirect(new URL("/", request.url));
  } catch (error) {
    console.error("WorkOS callback error:", error);
    return NextResponse.redirect(
      new URL("/?error=auth_failed", request.url)
    );
  }
}
