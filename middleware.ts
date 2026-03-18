import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/api/auth/confirm'];
const CRON_PREFIX = '/api/cron/';
const HEALTH_ROUTE = '/api/health';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes through without auth
  if (
    PUBLIC_ROUTES.some((route) => pathname.startsWith(route)) ||
    pathname === HEALTH_ROUTE
  ) {
    return NextResponse.next();
  }

  // Cron endpoints use CRON_SECRET bearer auth, not session auth
  if (pathname.startsWith(CRON_PREFIX)) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        supabaseResponse = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          supabaseResponse.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Match all routes except static files and _next internals
    '/((?!_next/static|_next/image|favicon.ico|favicons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
