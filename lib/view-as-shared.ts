// "View as member" for support: an admin opens a member's account in a
// read-only, time-limited view. Edge-safe (jose only, no database), so the
// middleware can enforce read-only without importing anything heavier.
//
// How it fits together:
// - The admin's own session cookie (wh_token) is never touched. Starting a
//   view sets a second cookie (wh_view_as) holding a short-lived token for the
//   member. getSession() prefers it while it is valid, and falls back to the
//   admin's own session when it has expired or been removed.
// - The member's session is forced to role 'user', so no admin, editor or
//   trustee guard admits it. A view can never be used to reach admin tools.
// - Middleware refuses every non-GET request while a view is active, except
//   the exit endpoint. The member's account cannot be changed through a view.

import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import { jwtSecret } from '@/lib/auth-edge'

export const VIEW_AS_COOKIE = 'wh_view_as'
// Display only: the banner reads the name and expiry from here. It is not
// trusted for anything, because the banner cannot grant or remove access.
export const VIEW_AS_META_COOKIE = 'wh_view_as_meta'
export const VIEW_AS_EXIT_PATH = '/api/view-as/exit'
export const VIEW_AS_TTL_SECONDS = 30 * 60
export const VIEW_AS_MIN_REASON_LENGTH = 10

const TOKEN_TYPE = 'view-as'

export interface ViewAsViewer {
  id: string
  email: string
  role: string
}

export interface ViewAsClaims extends JWTPayload {
  typ: typeof TOKEN_TYPE
  id: string
  email: string
  name: string
  role: 'user'
  membershipExpiry?: string | null
  viewer: ViewAsViewer
}

export interface ViewAsTarget {
  id: string
  role: string
  // True for accounts that must never be viewed: the master admin and any
  // blocked admin address. Computed by the caller from lib/admin-guard.
  protected: boolean
}

/**
 * Says why a view may not be started, or null when it may. Kept pure so the
 * rules can be tested without a database.
 */
export function viewAsRefusal(viewerId: string, target: ViewAsTarget, viewerIsMaster = false): string | null {
  if (target.id === viewerId) return 'You cannot view your own account this way.'
  // The master admin can view any other account, staff and protected ones alike.
  if (viewerIsMaster) return null
  if (target.protected) return 'This account cannot be viewed.'
  // Staff accounts are excluded on purpose: a view of an editor or admin would
  // show that person's admin tools, and the support need is the member's view.
  if (target.role !== 'user') return 'Only member accounts can be viewed. Staff accounts are not available here.'
  return null
}

export async function signViewAs(claims: Omit<ViewAsClaims, 'typ'>): Promise<string> {
  return new SignJWT({ ...claims, typ: TOKEN_TYPE })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${VIEW_AS_TTL_SECONDS}s`)
    .sign(jwtSecret())
}

/** Returns the claims of a valid, unexpired view token, or null. */
export async function verifyViewAs(token: string | undefined | null): Promise<ViewAsClaims | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, jwtSecret())
    if (payload.typ !== TOKEN_TYPE) return null
    return payload as ViewAsClaims
  } catch {
    return null
  }
}

/** Serialises the display-only cookie the banner reads. */
export function viewAsMetaValue(name: string, expiresAt: Date): string {
  return encodeURIComponent(JSON.stringify({ name, expiresAt: expiresAt.toISOString() }))
}
