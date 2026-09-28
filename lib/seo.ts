import type { Metadata } from 'next'

const DEFAULT_OG_IMAGE = '/opengraph-image'
const DEFAULT_OG_ALT = 'Wissen-Haus Empowerment Foundation'

// Next.js does NOT sync a page's top-level title/description into an
// inherited openGraph/twitter object -- if a page only sets `title` and
// `description`, it silently inherits the ROOT layout's openGraph object
// unchanged, so every shared link showed the homepage's generic card and
// title/description instead of the page's own. This wraps the fix so every
// page gets it consistently instead of hand-duplicating the same two blocks.
//
// Setting `openGraph` at all on a page REPLACES the parent's whole
// openGraph object rather than merging into it -- so this must also
// re-specify `images`, or the page loses the OG image entirely (not just
// falls back to the root's). Same for `twitter.images`.
export function pageMetadata(opts: {
  title: string
  ogTitle: string
  description: string
  /** Path to a custom OG image for this page; defaults to the site-wide one. */
  ogImage?: string
} & Omit<Metadata, 'title' | 'description' | 'openGraph' | 'twitter'>): Metadata {
  const { title, ogTitle, description, ogImage = DEFAULT_OG_IMAGE, ...rest } = opts
  return {
    title,
    description,
    openGraph: {
      title: ogTitle,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: DEFAULT_OG_ALT }],
    },
    twitter: { title: ogTitle, description, images: [ogImage] },
    ...rest,
  }
}
