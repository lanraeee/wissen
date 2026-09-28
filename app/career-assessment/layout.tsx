import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'
import { getOgCopy } from '@/lib/og'
import { ogSchemaFor } from '@/lib/og-schema'

// page.tsx is a client component ('use client'), which can't export
// `metadata` itself -- a server-side layout in the same segment is the
// standard way to attach metadata to a client-component page.
export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(await getOgCopy(ogSchemaFor('career-assessment')!))
}

export default function CareerAssessmentLayout({ children }: { children: React.ReactNode }) {
  return children
}
