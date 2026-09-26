import sql from './db'

/**
 * Records a visit for today and returns the current streak count.
 * Increments once per calendar day (no-op on a repeat call the same day),
 * and resets to 1 if a day was missed. Called from both login and the
 * session-check endpoint (/api/auth/me) -- a user who stays signed in via
 * their long-lived cookie and never re-enters credentials still needs their
 * streak to advance day to day, not just on days they explicitly log in.
 */
export async function recordVisit(userId: string): Promise<number> {
  const [row] = await sql`
    INSERT INTO visit_streaks (user_id, streak_count, last_visit)
    VALUES (${userId}, 1, CURRENT_DATE)
    ON CONFLICT (user_id) DO UPDATE SET
      streak_count = CASE
        WHEN visit_streaks.last_visit = CURRENT_DATE THEN visit_streaks.streak_count
        WHEN visit_streaks.last_visit = CURRENT_DATE - INTERVAL '1 day' THEN visit_streaks.streak_count + 1
        ELSE 1
      END,
      last_visit = CURRENT_DATE,
      updated_at = NOW()
    RETURNING streak_count
  `
  return row?.streak_count ?? 1
}
