import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("wos_session");

  if (!sessionCookie?.value) {
    return NextResponse.json({ user: null });
  }

  try {
    const session = JSON.parse(sessionCookie.value);
    return NextResponse.json({
      user: {
        convexUserId: session.convexUserId,
        workosUserId: session.workosUserId,
        email: session.email,
        name: session.name,
        avatarUrl: session.avatarUrl,
        role: session.role,
      },
    });
  } catch {
    return NextResponse.json({ user: null });
  }
}
