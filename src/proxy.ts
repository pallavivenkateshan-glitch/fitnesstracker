import { type NextRequest, NextResponse } from 'next/server'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next()
  }

  // If Supabase env vars are missing or placeholder, skip auth entirely
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (
    !supabaseUrl ||
    !supabaseKey ||
    supabaseUrl.includes('your_supabase') ||
    supabaseKey.includes('your_supabase')
  ) {
    return NextResponse.next()
  }

  try {
    const { updateSession } = await import('@/lib/supabase/middleware')
    return await updateSession(request)
  } catch (e) {
    console.error('Proxy middleware error:', e)
    // On any error, just let the request through rather than 404
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
