import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that don't require authentication
const publicRoutes = ['/', '/login', '/register', '/tenant-invite', '/api/auth']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route)) || pathname === '/') {
    return NextResponse.next()
  }

  // Allow API routes to handle their own auth
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // For protected pages, the client-side layout handles auth redirect
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
