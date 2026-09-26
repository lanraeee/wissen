# 008 — Career Fair booth recommendations: localStorage snapshot, not account-linked

## Context
The Career Clarity Fair registration form was asked to give attendees "directions to their preferred booths linked to their assessments" -- referring to the existing Career Assessment Accelerator (`app/career-assessment`). That assessment stores its results (`{ key, score, reasons }[]`) only in the browser's `localStorage` (`wh_assessmentResults`), entirely client-side, with no server-side or account-linked storage at all today.

## Decision
Don't build account-linked assessment storage as a prerequisite. Instead, at registration time the client reads `wh_assessmentResults` from `localStorage` if present and includes it in the registration payload as `assessment_snapshot`. `lib/career-fair.ts` maps the top result's key to a booth category (`interestFromAssessment`) and combines it with the registrant's explicitly chosen interest to recommend booths (`recommendBooths`).

## Consequences
- This only works when the visitor registers on the same browser/device where they took the assessment. Register from a different phone, a shared school computer, or after clearing site data, and there's no snapshot -- the booth recommendation falls back to their explicitly chosen career interest alone, which every registrant provides regardless.
- No new auth/account plumbing was needed to ship this. If accurate cross-device linkage becomes a real requirement later, the actual fix is persisting assessment results server-side against the user's account (a superset of "log in before taking the assessment") -- worth a fresh ADR of its own if that's ever prioritized, not a patch on top of this one.
- The key→category mapping in `lib/career-fair.ts` is maintained by hand against the 12 career profiles defined in `app/career-assessment/page.tsx`. If a new profile is added there, it won't get booth recommendations until this mapping is updated too -- there's no shared source of truth enforcing the two stay in sync.
