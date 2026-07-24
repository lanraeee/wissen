import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Career Pathways Assessment — Wissen Haus',
  description: 'Get a personalised career roadmap tailored to your interests, skills, and aspirations. For professionals, graduates, and undergraduates.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
