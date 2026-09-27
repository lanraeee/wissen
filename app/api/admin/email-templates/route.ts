import { NextResponse } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import { EMAIL_TEMPLATES, EMAIL_CATEGORIES } from '@/lib/email-catalog'

export async function GET() {
  const session = await adminGuard()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  return NextResponse.json({ templates: EMAIL_TEMPLATES, categories: EMAIL_CATEGORIES })
}
