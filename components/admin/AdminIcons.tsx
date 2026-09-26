// Shared icon set for admin nav (desktop sidebar + mobile bottom bar/drawer).
// Plain inline SVGs, matching the outline style used across the public site
// (stroke="currentColor", strokeWidth ~2) so the admin panel feels consistent
// with it rather than importing a separate icon library for ten glyphs.

type IconProps = { size?: number }

const base = (size: number) => ({
  width: size, height: size, viewBox: '0 0 24 24', fill: 'none' as const,
  stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
})

export function DashboardIcon({ size = 20 }: IconProps) {
  return <svg {...base(size)}><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></svg>
}
export function AnalyticsIcon({ size = 20 }: IconProps) {
  return <svg {...base(size)}><path d="M4 20V10M12 20V4M20 20v-7" /></svg>
}
export function UsersIcon({ size = 20 }: IconProps) {
  return <svg {...base(size)}><circle cx="9" cy="8" r="3.2" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 5.2a3.2 3.2 0 0 1 0 6.2M21.5 20a6.5 6.5 0 0 0-4-6" /></svg>
}
export function SubmissionsIcon({ size = 20 }: IconProps) {
  return <svg {...base(size)}><path d="M4 12h4l2 3h4l2-3h4" /><path d="M5.5 5h13l2 7v7a1 1 0 0 1-1 1H4.5a1 1 0 0 1-1-1v-7z" /></svg>
}
export function OpportunitiesIcon({ size = 20 }: IconProps) {
  return <svg {...base(size)}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
}
export function CoursesIcon({ size = 20 }: IconProps) {
  return <svg {...base(size)}><path d="M2 8l10-4 10 4-10 4-10-4z" /><path d="M6 10.5V16c0 1.4 2.7 3 6 3s6-1.6 6-3v-5.5" /></svg>
}
export function ProjectsIcon({ size = 20 }: IconProps) {
  return <svg {...base(size)}><path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z" /></svg>
}
export function CareerFairIcon({ size = 20 }: IconProps) {
  return <svg {...base(size)}><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18" /><path d="M8 2v4M16 2v4" /><path d="M8 13.5l2 2 4-4.5" /></svg>
}
export function TestimonialsIcon({ size = 20 }: IconProps) {
  return <svg {...base(size)}><path d="M7 15h2l1.5-3V7H5v5h2.5zM15 15h2l1.5-3V7H13v5h2.5z" /></svg>
}
export function ContentIcon({ size = 20 }: IconProps) {
  return <svg {...base(size)}><path d="M4 4h11l5 5v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" /><path d="M14 4v6h6" /></svg>
}
export function SettingsIcon({ size = 20 }: IconProps) {
  return <svg {...base(size)}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>
}
export function MoreIcon({ size = 20 }: IconProps) {
  return <svg {...base(size)}><circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none" /></svg>
}
export function CloseIcon({ size = 20 }: IconProps) {
  return <svg {...base(size)}><path d="M18 6L6 18M6 6l12 12" /></svg>
}
export function MenuIcon({ size = 20 }: IconProps) {
  return <svg {...base(size)}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
}

export const NAV_ICONS: Record<string, (props: IconProps) => React.ReactElement> = {
  '/admin': DashboardIcon,
  '/admin/analytics': AnalyticsIcon,
  '/admin/users': UsersIcon,
  '/admin/submissions': SubmissionsIcon,
  '/admin/opportunities': OpportunitiesIcon,
  '/admin/courses': CoursesIcon,
  '/admin/projects': ProjectsIcon,
  '/admin/career-fair': CareerFairIcon,
  '/admin/testimonials': TestimonialsIcon,
  '/admin/content': ContentIcon,
  '/admin/settings': SettingsIcon,
}
