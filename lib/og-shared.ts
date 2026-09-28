// Types and the page registry for the editable Open Graph / meta system.
// Deliberately free of any database/server-only import: the admin editor is
// a client component, so anything it needs has to be safe to ship to the
// browser. The server-side reader (getOgCopy) lives in lib/og.ts, which
// re-exports everything here -- same split as lib/page-copy-shared.ts.

export interface OgCopy {
  title: string
  ogTitle: string
  description: string
}

export interface OgPageSchema {
  slug: string
  label: string
  /** The <title> tag text -- includes the "· Wissen-Haus" suffix, matches what shows in the browser tab. */
  defaultTitle: string
  /** The social-share card title (og:title / twitter:title) -- usually shorter, no suffix. */
  defaultOgTitle: string
  defaultDescription: string
}

export const OG_TITLE_MAX = 70
export const OG_OG_TITLE_MAX = 70
export const OG_DESCRIPTION_MAX = 300

export function ogSiteContentKeyFor(slug: string): string {
  return `og_meta_${slug.replace(/-/g, '_')}`
}
