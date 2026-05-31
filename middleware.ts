import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const MAINTENANCE_PATH = '/maintenance'

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const { pathname } = request.nextUrl
  
  // Handle www → non-www redirect for SEO consistency
  if (host.startsWith('www.')) {
    const newUrl = new URL(request.url)
    newUrl.host = host.replace('www.', '')
    newUrl.protocol = 'https:'
    return NextResponse.redirect(newUrl.toString(), 301)
  }

  if (pathname === '/api/stripe/checkout') {
    return NextResponse.json(
      {
        error: 'Precision Sewer Inspection checkout is temporarily unavailable during planned maintenance.',
      },
      {
        status: 503,
        headers: {
          'Retry-After': '7200',
        },
      }
    )
  }

  const maintenanceBypass =
    pathname === MAINTENANCE_PATH ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/technician') ||
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.json'

  if (!maintenanceBypass) {
    const maintenanceUrl = request.nextUrl.clone()
    maintenanceUrl.pathname = MAINTENANCE_PATH
    maintenanceUrl.search = ''
    return NextResponse.rewrite(maintenanceUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all request paths except static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)$).*)',
  ],
}
