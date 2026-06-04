import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { LOCALES, DEFAULT_LOCALE } from '@/lib/i18n'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Refresh Supabase session
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session (don't call getUser in proxy — just refresh)
  await supabase.auth.getSession()

  // Handle lang redirect at root
  if (pathname === '/') {
    const langCookie = request.cookies.get('lang')?.value
    const lang =
      langCookie && (LOCALES as string[]).includes(langCookie)
        ? langCookie
        : DEFAULT_LOCALE
    return NextResponse.redirect(new URL(`/${lang}`, request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.ico$).*)',
  ],
}
