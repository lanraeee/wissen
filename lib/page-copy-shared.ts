// Types and the schema registry for the generic page-copy system.
// Deliberately free of any database/server-only import: the admin editor is
// a client component, so anything it needs has to be safe to ship to the
// browser. The server-side reader (getPageCopy) lives in lib/page-copy.ts,
// which re-exports everything here -- same split as lib/bank-transfer-shared.ts.
//
// This is a generic, safe "edit this page's wording" system for pages that
// are otherwise plain hardcoded JSX. Deliberately NOT a raw-HTML/rich-text
// editor (unlike email_templates.html, which is trusted admin-authored
// markup) -- every field is plain text only, rendered as a normal JSX text
// node (React escapes it automatically), with a fixed set of fields per
// page. An admin can reword a page; they cannot add/remove sections, inject
// markup, or otherwise change page structure/layout -- that's the actual
// safeguard against "accidentally breaking a page."

export type PageCopyFieldType = 'text' | 'textarea'

export interface PageCopyField {
  key: string
  label: string
  type: PageCopyFieldType
  /** The page's current hardcoded copy -- used both as the editor's placeholder and the page's runtime fallback if never saved. */
  default: string
  maxLength: number
}

export interface PageCopySchema {
  slug: string
  label: string
  fields: PageCopyField[]
}

export function pageCopyText(key: string, label: string, def: string, maxLength = 200): PageCopyField {
  return { key, label, type: 'text', default: def, maxLength }
}

export function pageCopyTextarea(key: string, label: string, def: string, maxLength = 2000): PageCopyField {
  return { key, label, type: 'textarea', default: def, maxLength }
}

export function siteContentKeyFor(slug: string): string {
  return `page_copy_${slug.replace(/-/g, '_')}`
}
