import type { Metadata } from 'next'

// Next.js does NOT sync a page's top-level title/description into an
// inherited openGraph/twitter object -- if a page only sets `title` and
// `description`, it silently inherits the ROOT layout's openGraph object
// unchanged, so every shared link showed the homepage's generic card and
// title/description instead of the page's own. This wraps the fix so every
// page gets it consistently instead of hand-duplicating the same two blocks.
export function pageMetadata(opts: {
  title: string
  ogTitle: string
  description: string
} & Omit<Metadata, 'title' | 'description' | 'openGraph' | 'twitter'>): Metadata {
  const { title, ogTitle, description, ...rest } = opts
  return {
    title,
    description,
    openGraph: { title: ogTitle, description },
    twitter: { title: ogTitle, description },
    ...rest,
  }
}
