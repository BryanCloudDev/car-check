import { NextRequest, NextResponse } from 'next/server';
import { defaultLocale, isLocale, LOCALE_COOKIE } from '@/i18n/config';

const ONE_YEAR = 60 * 60 * 24 * 365;

function withLocaleCookie(request: NextRequest, response: NextResponse) {
  if (!isLocale(request.cookies.get(LOCALE_COOKIE)?.value)) {
    response.cookies.set(LOCALE_COOKIE, defaultLocale, {
      path: '/',
      maxAge: ONE_YEAR,
      sameSite: 'lax',
    });
  }
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get('session')?.value;

  if (!session && pathname !== '/login') {
    return withLocaleCookie(
      request,
      NextResponse.redirect(new URL('/login', request.url)),
    );
  }

  if (session && pathname === '/login') {
    return withLocaleCookie(
      request,
      NextResponse.redirect(new URL('/vehiculos', request.url)),
    );
  }

  return withLocaleCookie(request, NextResponse.next());
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon\\.ico).*)'],
};
