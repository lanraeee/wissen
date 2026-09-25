CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  membership_expiry TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration (run once on existing DBs):
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

CREATE TABLE IF NOT EXISTS course_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  module_id INTEGER NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_cp_user_id ON course_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_cp_course_id ON course_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_cp_completed_at ON course_progress(completed_at DESC);

CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  certificate_id TEXT UNIQUE NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_cert_user_id ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_cert_certificate_id ON certificates(certificate_id);
CREATE INDEX IF NOT EXISTS idx_cert_issued_at ON certificates(issued_at DESC);

CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  data JSONB,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sub_type ON submissions(type);
CREATE INDEX IF NOT EXISTS idx_sub_created_at ON submissions(created_at DESC);

CREATE TABLE IF NOT EXISTS visit_streaks (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  streak_count INTEGER DEFAULT 1,
  last_visit DATE DEFAULT CURRENT_DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS opportunities (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  source TEXT NOT NULL,
  title TEXT NOT NULL,
  company TEXT,
  url TEXT NOT NULL,
  date_posted DATE,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  eligibility TEXT,
  eligibility_label TEXT,
  tags TEXT[],
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opp_type ON opportunities(type);
CREATE INDEX IF NOT EXISTS idx_opp_source ON opportunities(source);
CREATE INDEX IF NOT EXISTS idx_opp_updated_at ON opportunities(updated_at DESC);

CREATE TABLE IF NOT EXISTS site_content (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pathname TEXT NOT NULL,
  referrer TEXT,
  country TEXT,
  city TEXT,
  device_type TEXT,
  browser TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pv_created_at ON page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pv_pathname   ON page_views(pathname);
CREATE INDEX IF NOT EXISTS idx_pv_session    ON page_views(session_id);

-- Ties a page view to the signed-in user who made it (nullable: most
-- visitors are anonymous). Lets the admin activity view show "pages
-- visited" and approximate location (country/city, already collected
-- above) per user, not just in aggregate.
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_pv_user ON page_views(user_id, created_at DESC);

-- One row per successful login: when, from what IP/user agent. Distinct from
-- visit_streaks (which only tracks daily granularity for the streak counter)
-- -- this is the actual session history shown in a user's activity view.
CREATE TABLE IF NOT EXISTS login_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_login_events_user ON login_events(user_id, created_at DESC);

-- Audit trail of admin-panel write actions (who did what, to what, when).
-- actor_role is captured at the time of the action rather than joined from
-- users.role, so the log stays accurate even after a later role change.
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_email TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_activity_actor      ON admin_activity_log(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_created_at ON admin_activity_log(created_at DESC);
