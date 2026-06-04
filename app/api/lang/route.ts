import { NextRequest, NextResponse } from 'next/server'
import { LOCALES } from '@/lib/i18n'
import type { Lang } from '@/types'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const lang: Lang = LOCALES.includes(body.lang) ? body.lang : 'en'
  const response = NextResponse.json({ ok: true })
  response.cookies.set('lang', lang, { path: '/', maxAge: 60 * 60 * 24 * 365 })
  return response
}
