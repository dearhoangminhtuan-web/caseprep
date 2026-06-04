import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lang: string }> }
) {
  const { lang } = await params
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const origin = request.nextUrl.origin

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(`${origin}/${lang}/login?error=auth`)
    }
  }

  return NextResponse.redirect(`${origin}/${lang}/dashboard`)
}
