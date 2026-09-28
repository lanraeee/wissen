import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'

// page.tsx is a client component ('use client'), which can't export
// `metadata` itself -- a server-side layout in the same segment is the
// standard way to attach metadata to a client-component page.
export const metadata: Metadata = pageMetadata({
  title: 'Career Assessment · Wissen-Haus',
  ogTitle: 'Career Assessment',
  description: 'Take the free Wissen-Haus Career Assessment to discover career paths that match your interests and strengths, with personalised next steps.',
})

export default function CareerAssessmentLayout({ children }: { children: React.ReactNode }) {
  return children
}
