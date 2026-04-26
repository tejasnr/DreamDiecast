import { NextRequest, NextResponse } from 'next/server';

const MAINTENANCE_MODE = true;
const BYPASS_COOKIE = 'maintenance_bypass';
const BYPASS_SECRET = 'dreamdiecast-owner-2024'; // Change this to whatever you want

export function middleware(request: NextRequest) {
  if (!MAINTENANCE_MODE) return NextResponse.next();

  const { pathname } = request.nextUrl;

  // Allow the maintenance page, bypass API, static files, and Next internals
  if (
    pathname === '/maintenance' ||
    pathname.startsWith('/api/bypass') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.ico')
  ) {
    return NextResponse.next();
  }

  // If user has the bypass cookie, let them through
  const bypass = request.cookies.get(BYPASS_COOKIE);
  if (bypass?.value === BYPASS_SECRET) {
    return NextResponse.next();
  }

  // Everyone else gets redirected to maintenance page
  const maintenanceUrl = new URL('/maintenance', request.url);
  return NextResponse.rewrite(maintenanceUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
