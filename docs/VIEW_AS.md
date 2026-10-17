# View as member (support)

Lets a director or admin open a member's account, read-only, to see what the member sees when they ask for help. Reached from **Admin → Users → View as member**.

## Using it

1. Find the member on **Admin → Users** and click **View as member** (shown only for ordinary member accounts).
2. Give a reason (at least 10 characters) and re-enter your own password. The reason is recorded.
3. The member's pages open with an orange banner: *Viewing as …, read-only, ends at HH:MM*. Click **Exit view** to return to your own account. The view also ends by itself after 30 minutes.

## Rules

| Rule | Where it is enforced |
|---|---|
| Only the director and `admin` role can start a view. Editors and trustees cannot. | `userAdminGuard()` in `app/api/admin/view-as/route.ts` |
| Only `user` accounts can be viewed. Staff, the master admin and blocked admin addresses cannot. You cannot view yourself. | `viewAsRefusal()` in `lib/view-as-shared.ts` |
| Your password is re-checked, and starts are rate-limited (10 per 15 minutes per IP). | `app/api/admin/view-as/route.ts`, `lib/rate-limit.ts` |
| Starting is logged before access is granted. If the log cannot be written, the view does not start. | `logActivityRequired()` in `lib/audit-log.ts` |
| Read-only: every write (API, page form or server action) returns 403 while a view is live. Only the exit endpoint may write. | `middleware.ts` |
| The member's session never carries admin rights. Its role is forced to `user`, so admin guards refuse it. | `getSession()` in `lib/auth.ts` |
| Your own session (`wh_token`) is untouched. Exiting restores it. | separate `wh_view_as` cookie |
| The view expires after 30 minutes. An expired view is ignored, and the browser falls back to your own session. | `VIEW_AS_TTL_SECONDS` |

## Audit trail

Recorded in `admin_activity_log`:

- `user.view_as.start`: target member id, your reason, expiry time
- `user.view_as.end`: target member id (written when you click Exit; not written if the view simply expires)

Reads during a view are not logged individually. The start row, with its reason, is the record of the access.

## Not covered (decide before relying on it)

- The member is not notified that a support agent viewed their account. Adding an email notice is a policy decision for the foundation.
- Only the members' pages are viewable. Support tickets and other admin screens are not part of this feature.
