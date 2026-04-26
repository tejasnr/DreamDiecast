import { NextRequest, NextResponse } from 'next/server';

const BYPASS_SECRET = 'dreamdiecast-owner-2024';

export async function GET(request: NextRequest) {
  const url = new URL('/', request.url);
  const response = NextResponse.redirect(url);

  response.cookies.set('maintenance_bypass', BYPASS_SECRET, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });

  return response;
}
