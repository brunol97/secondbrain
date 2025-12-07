import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'

import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let res = NextResponse.next()

  // Create a Supabase client configured to use cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        req.cookies.set({
          name,
          value,
          ...options,
        })
        res = NextResponse.next({
          request: {
            headers: req.headers,
          },
        })
        res.cookies.set({
          name,
          value,
          ...options,
        })
      },
      remove(name: string, options: CookieOptions) {
        req.cookies.set({
          name,
          value: '',
          ...options,
        })
        res = NextResponse.next({
          request: {
            headers: req.headers,
          },
        })
        res.cookies.set({
          name,
          value: '',
          ...options,
        })
      },
    },
  }
  )

  // Refresh session if expired - required for Server Components
  // https://supabase.com/docs/guides/auth/auth-helpers/nextjs#managing-session-with-middleware
  const {
    data: { user }
  } = await supabase.auth.getUser()

  // OPTIONAL: this forces users to be logged in to use the chatbot.
  // If you want to allow anonymous users, simply remove the check below.
  if (
    !user &&
    !req.url.includes('/sign-in') &&
    !req.url.includes('/sign-up')
  ) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/sign-in'
    redirectUrl.searchParams.set(`redirectedFrom`, req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - share (publicly shared chats)
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!share|api|_next/static|_next/image|favicon.ico).*)'
  ]
}
