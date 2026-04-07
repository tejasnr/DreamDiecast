import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("wos_session");
  return NextResponse.json({ ok: true });
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  cookieStore.delete("wos_session");
  return NextResponse.redirect(new URL("/", request.url));
}
