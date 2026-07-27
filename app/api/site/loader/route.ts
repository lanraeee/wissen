import { NextResponse } from 'next/server'
import sql from '@/lib/db'

export async function GET() {
  try {
    const rows = await sql`SELECT value FROM site_content WHERE key = 'site_settings'`
    const settings = rows[0]?.value ?? {}
    return NextResponse.json({ enabled: settings.loader_enabled !== false })
  } catch {
    return NextResponse.json({ enabled: true })
  }
}
