import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const host = request.headers.get('host') || ''
  
  // Handle www → non-www redirect for SEO consistency
  if (host.startsWith('www.')) {
    // Use the public Host authority; request.url can contain the internal
    // Next.js server port when the proxy runs in the Node runtime.
    const newUrl = new URL(`https://${host.slice(4)}`)
    newUrl.pathname = request.nextUrl.pathname
    newUrl.search = request.nextUrl.search
    return NextResponse.redirect(newUrl.toString(), 301)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all request paths except static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)$).*)',
  ],
}
