import type { Metadata } from 'next'
import sql from '@/lib/db'

// page.tsx is a client component ('use client'), which can't export
// generateMetadata itself -- a server-side layout in the same segment can,
// including access to the route's params, so a shared thread link shows its
// actual title/excerpt instead of the generic site-wide card.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  try {
    const [thread] = await sql`SELECT title, body FROM forum_threads WHERE id = ${id}`
    if (!thread) return { title: 'Thread Not Found · Wissen-Haus Community' }
    const description = (thread.body as string).replace(/\s+/g, ' ').trim().slice(0, 160)
    return {
      title: `${thread.title} · Wissen-Haus Community`,
      description,
      openGraph: { title: thread.title as string, description },
      twitter: { title: thread.title as string, description },
    }
  } catch {
    return { title: 'Wissen-Haus Community' }
  }
}

export default function ThreadLayout({ children }: { children: React.ReactNode }) {
  return children
}
