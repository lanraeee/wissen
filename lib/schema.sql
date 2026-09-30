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

-- Career Clarity Fair: multiple concurrent events (different schools/dates),
-- each with its own registration list and set of booths. Booths are a JSONB
-- array rather than a child table -- a handful of entries per event, always
-- read/written as a whole with the event, never queried independently.
CREATE TABLE IF NOT EXISTS fair_events (
  id          SERIAL PRIMARY KEY,
  slug        TEXT UNIQUE NOT NULL,
  title       TEXT NOT NULL,
  school      TEXT,
  location    TEXT,
  event_date  DATE,
  event_time  TEXT,
  status      TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','closed')),
  description TEXT,
  booths      JSONB NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fair_events_status ON fair_events(status, event_date);

CREATE TABLE IF NOT EXISTS fair_registrations (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id             INTEGER NOT NULL REFERENCES fair_events(id) ON DELETE CASCADE,
  name                 TEXT NOT NULL,
  email                TEXT,
  phone                TEXT,
  school               TEXT NOT NULL,
  class_grade          TEXT,
  career_interest      TEXT,
  attending_as         TEXT NOT NULL DEFAULT 'Student' CHECK (attending_as IN ('Student', 'Volunteer', 'Mentor')),
  -- Best-effort snapshot of the visitor's existing Career Assessment result,
  -- read from browser localStorage at registration time (the assessment has
  -- no server-side/account-linked storage today -- see docs/adr/008). Null
  -- whenever they registered on a different device or never took it.
  assessment_snapshot  JSONB,
  newsletter_opt_in    BOOLEAN NOT NULL DEFAULT false,
  checked_in           BOOLEAN NOT NULL DEFAULT false,
  checked_in_at        TIMESTAMPTZ,
  checkin_token        TEXT UNIQUE NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fair_reg_event    ON fair_registrations(event_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fair_reg_token    ON fair_registrations(checkin_token);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email              TEXT UNIQUE NOT NULL,
  name               TEXT,
  source             TEXT NOT NULL DEFAULT 'admin',
  status             TEXT NOT NULL DEFAULT 'subscribed' CHECK (status IN ('subscribed', 'unsubscribed')),
  unsubscribe_token  TEXT UNIQUE NOT NULL,
  subscribed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unsubscribed_at    TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_status ON newsletter_subscribers(status);

-- `body` is full HTML+CSS the admin authors directly (components/admin/
-- newsletter/*), wrapped in lib/email.ts's shell() at send/preview time --
-- same trust model as email_templates.html below (admin-only, see its note).
CREATE TABLE IF NOT EXISTS newsletter_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  subject     TEXT NOT NULL DEFAULT '',
  body        TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS newsletter_campaigns (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject           TEXT NOT NULL,
  body              TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'sent', 'failed')),
  recipient_count   INTEGER NOT NULL DEFAULT 0,
  sent_count        INTEGER NOT NULL DEFAULT 0,
  failed_count      INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at           TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_status ON newsletter_campaigns(status, created_at DESC);

-- Per-template admin override for the transactional emails in
-- lib/email.ts (see lib/email-catalog.ts for the full set of ids and their
-- built-in defaults). A row here means "this template has been customized";
-- no row means the send functions use their built-in default. `html` is raw
-- HTML+CSS the admin authors directly -- an intentional exception to this
-- codebase's usual escape-everything rule, scoped to admin-only content that
-- was already going to become an email's raw HTML one way or another.
CREATE TABLE IF NOT EXISTS email_templates (
  id          TEXT PRIMARY KEY,
  subject     TEXT NOT NULL,
  html        TEXT NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Dedicated per-form tables ──────────────────────────────────────────────
-- Replaces the generic `submissions` (type-tagged, JSONB `data`) table for
-- contact/volunteer/partner/donation/bank_transfer -- each form gets real
-- columns and its own admin page instead of sharing one key-value dump.
-- `submissions` itself is left in place (nothing writes to it after this),
-- since it's still a documented generic capture endpoint (see docs/API.md).

CREATE TABLE IF NOT EXISTS contact_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  subject     TEXT NOT NULL,
  message     TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','actioned')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status_created ON contact_messages(status, created_at DESC);

CREATE TABLE IF NOT EXISTS volunteer_applications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL,
  message     TEXT,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','actioned')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_volunteer_apps_status_created ON volunteer_applications(status, created_at DESC);

-- `partnership_type` is new: components/PartnerForm.tsx already collects it
-- (School/Corporate/Individual Mentor/NGO/Media/Other) but the old generic
-- route discarded it before it ever reached the DB.
CREATE TABLE IF NOT EXISTS partner_inquiries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  email             TEXT NOT NULL,
  organisation      TEXT NOT NULL,
  partnership_type  TEXT,
  message           TEXT,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','actioned')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_partner_inquiries_status_created ON partner_inquiries(status, created_at DESC);

-- Ledger of completed gifts (Stripe or a confirmed bank transfer). UNIQUE on
-- reference makes recording idempotent -- INSERT ... ON CONFLICT (reference)
-- DO NOTHING RETURNING * -- so a retried Stripe webhook (or the donor
-- reloading /donate/success) can never double-record the same payment.
-- cert_id is unique too: it's a deterministic function of the reference
-- (see lib/donations.ts), so this also guards against the (extremely
-- unlikely but previously unguarded) collision case.
CREATE TABLE IF NOT EXISTS donations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  amount      NUMERIC(12,2) NOT NULL,
  currency    TEXT NOT NULL,
  reference   TEXT NOT NULL,
  provider    TEXT NOT NULL CHECK (provider IN ('Stripe','Bank Transfer')),
  cert_id     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_donations_reference ON donations(reference);
CREATE UNIQUE INDEX IF NOT EXISTS idx_donations_cert_id   ON donations(cert_id) WHERE cert_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON donations(created_at DESC);

-- A pledge's own lifecycle, one plain `status` column (replacing the old
-- outer-column/nested-JSONB dual-status mapping). `donation_id` links to the
-- `donations` row created once the pledge is confirmed (one direction only,
-- to avoid a circular FK) -- replaces the old implicit "same reference
-- string" join between a confirmed pledge and its donation record.
CREATE TABLE IF NOT EXISTS bank_transfers (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference      TEXT NOT NULL,
  name           TEXT NOT NULL,
  email          TEXT NOT NULL,
  amount         NUMERIC(12,2) NOT NULL,
  currency       TEXT NOT NULL,
  message        TEXT,
  status         TEXT NOT NULL DEFAULT 'awaiting_transfer'
                   CHECK (status IN ('awaiting_transfer','declared_sent','confirmed','cancelled')),
  declared_at    TIMESTAMPTZ,
  confirmed_at   TIMESTAMPTZ,
  donation_id    UUID REFERENCES donations(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bank_transfers_reference ON bank_transfers(reference);
CREATE INDEX IF NOT EXISTS idx_bank_transfers_status_created ON bank_transfers(status, created_at DESC);

-- DataCamp Donates scholarship applications. First-class columns for what
-- the admin sorts/filters by (score, status, email) -- the full 27-question
-- answer set lives in one `answers` JSONB blob, same convention as
-- fair_registrations.assessment_snapshot -- always read/written as a whole,
-- never queried field-by-field.
CREATE TABLE IF NOT EXISTS scholarship_applications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  email            TEXT NOT NULL,
  phone            TEXT,
  age_range        TEXT,
  country          TEXT,
  state_region      TEXT,
  city             TEXT,
  answers          JSONB NOT NULL,
  score            INTEGER NOT NULL,
  score_breakdown  JSONB NOT NULL,
  red_flags        TEXT[] NOT NULL DEFAULT '{}',
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','shortlisted','awarded','declined','waitlisted')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_scholarship_apps_score      ON scholarship_applications(score DESC);
CREATE INDEX IF NOT EXISTS idx_scholarship_apps_status     ON scholarship_applications(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scholarship_apps_email      ON scholarship_applications(email);

-- Editor content changes awaiting a director's approval. Editors may edit all
-- site copy, but their writes land here instead of site_content: nothing they
-- submit is public until a director approves it. Admins and directors still
-- write straight through, so this queue only ever holds editor proposals.
--
-- proposed_value carries the WHOLE value for that key, not a patch, matching
-- how site_content is written (the editors PUT a complete object). previous_value
-- is the snapshot taken at submission time, so a reviewer can see what changes
-- and an approval that lost a race is recognisable rather than silent.
CREATE TABLE IF NOT EXISTS content_change_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_key       TEXT NOT NULL,
  proposed_value    JSONB NOT NULL,
  previous_value    JSONB,
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','approved','rejected')),
  requested_by_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  requested_by_email TEXT NOT NULL,
  requested_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_by_email TEXT,
  reviewed_at       TIMESTAMPTZ,
  review_note       TEXT
);
CREATE INDEX IF NOT EXISTS idx_content_requests_pending ON content_change_requests(status, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_requests_key     ON content_change_requests(content_key, requested_at DESC);

-- Support tickets. contact_messages stays as-is (a one-shot form, no reply
-- thread); this is the two-way conversation store behind the support page,
-- the live chat widget and the AI agent -- all three write here, so a chat
-- that escalates becomes the same ticket a staff member already sees rather
-- than a second record of the same conversation.
--
-- `reference` is what a visitor quotes to find their ticket again without an
-- account. It is a capability token, not a serial: anyone holding it can read
-- the thread, so it is generated from crypto random bytes and never shortened.
CREATE TABLE IF NOT EXISTS support_tickets (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference      TEXT NOT NULL UNIQUE,
  subject        TEXT NOT NULL,
  requester_name  TEXT NOT NULL,
  requester_email TEXT,
  user_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  channel        TEXT NOT NULL DEFAULT 'form' CHECK (channel IN ('form','chat')),
  status         TEXT NOT NULL DEFAULT 'open'
                   CHECK (status IN ('open','pending','resolved','closed')),
  priority       TEXT NOT NULL DEFAULT 'normal'
                   CHECK (priority IN ('low','normal','high')),
  assigned_email TEXT,
  ai_handled     BOOLEAN NOT NULL DEFAULT FALSE,
  escalated      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tickets_status   ON support_tickets(status, last_activity DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_user     ON support_tickets(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned ON support_tickets(assigned_email, status);

-- One turn of a ticket conversation. author_type distinguishes the three
-- writers so the UI can style them and so "did a human ever answer this?"
-- stays answerable. audio_id points at a voice note the visitor recorded;
-- body then holds its transcript, which is produced in the browser -- the
-- audio is kept so staff can listen when the transcript is poor or absent.
CREATE TABLE IF NOT EXISTS ticket_messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id    UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  author_type  TEXT NOT NULL CHECK (author_type IN ('visitor','staff','ai')),
  author_name  TEXT NOT NULL,
  body         TEXT NOT NULL,
  audio_id     UUID,
  internal     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_thread ON ticket_messages(ticket_id, created_at);

-- Voice notes, stored as bytes in Postgres rather than an object store.
-- No blob storage is provisioned, and a capped 60-second opus recording is
-- ~180 KB -- small enough that adding a vendor (and its cost, its token, its
-- outage surface) is not yet worth it. Revisit if volume makes this heavy;
-- the served route is the only thing that would change.
CREATE TABLE IF NOT EXISTS voice_notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
  mime_type   TEXT NOT NULL,
  bytes       BYTEA NOT NULL,
  duration_ms INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_voice_notes_ticket ON voice_notes(ticket_id);

-- Monthly spend ledger for the AI agent. One row per calendar month, counted
-- server-side before each call, so a runaway loop or an abusive session cannot
-- quietly run up an Anthropic bill on a foundation's card. The cap itself is
-- configured in lib/support-agent.ts.
CREATE TABLE IF NOT EXISTS ai_usage (
  month         TEXT PRIMARY KEY,
  calls         INTEGER NOT NULL DEFAULT 0,
  input_tokens  BIGINT NOT NULL DEFAULT 0,
  output_tokens BIGINT NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Who a support conversation is with. Captured once when the ticket opens, so
-- a staff member answering is not guessing at context: device and browser tell
-- them whether "the button does nothing" is a mobile Safari problem, and the
-- entry page tells them what the person was reading when they gave up.
--
-- Coarse geo only. These come from Vercel's edge headers, which resolve to the
-- ISP's egress point -- useful for "which country am I supporting", useless
-- and misleading as a location. Street-level is NOT derivable from an IP and
-- is deliberately not attempted here.
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS device_type   TEXT;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS browser       TEXT;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS os            TEXT;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS user_agent    TEXT;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS geo_country   TEXT;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS geo_region    TEXT;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS geo_city      TEXT;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS entry_page    TEXT;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS referrer      TEXT;

-- Precise location, only ever written when the visitor taps "share my
-- location" and accepts the browser's own permission prompt. There is no
-- covert path to this data and this schema does not pretend otherwise:
-- shared_at records WHEN consent was given, which is what makes the record
-- defensible under NDPA/UK GDPR and what a retention job would sweep on.
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS geo_lat            DOUBLE PRECISION;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS geo_lng            DOUBLE PRECISION;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS geo_accuracy_m     INTEGER;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS geo_shared_at      TIMESTAMPTZ;

-- Every run of the staff-facing database agent, recorded before the answer is
-- returned. The agent can read any table, so "what did it look at, for whom,
-- and why" has to be answerable after the fact -- by the master admin, by an
-- auditor, or by whoever is working out how something leaked. queries holds
-- the SQL it actually executed, which is the part that matters.
CREATE TABLE IF NOT EXISTS ai_agent_runs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_email   TEXT NOT NULL,
  prompt        TEXT NOT NULL,
  queries       JSONB NOT NULL DEFAULT '[]'::jsonb,
  answer        TEXT,
  refused       BOOLEAN NOT NULL DEFAULT FALSE,
  input_tokens  INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_agent_runs_actor ON ai_agent_runs(actor_email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_agent_runs_time  ON ai_agent_runs(created_at DESC);

-- Knowledge base the support agent answers from.
--
-- Two sources feed it. 'server' entries are rebuilt from live site data
-- (content, courses, opportunities, partner scholarships) and are disposable:
-- a rebuild replaces them wholesale. 'answer' entries come from a staff reply
-- to a question the agent could not handle, and are NOT disposable -- they are
-- the only thing here a human wrote deliberately, so a rebuild must never
-- delete them.
--
-- Retrieval is Postgres full-text search. At this data size it is accurate
-- enough on the vocabulary visitors actually use, and it costs nothing per
-- question -- which matters when the alternative is an embedding call on every
-- message a visitor sends.
CREATE TABLE IF NOT EXISTS kb_entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source      TEXT NOT NULL CHECK (source IN ('server','answer')),
  source_key  TEXT,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  -- 'pending' entries are invisible to the agent. A staff answer lands here
  -- and stays out of play until someone approves it, because an answer that
  -- was right for one person ("yes, you qualify") becomes an answer the agent
  -- would otherwise give everyone.
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','pending','archived')),
  approved_by TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  search      TSVECTOR GENERATED ALWAYS AS (
                setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
                setweight(to_tsvector('english', coalesce(body, '')), 'B')
              ) STORED
);
CREATE INDEX IF NOT EXISTS idx_kb_search ON kb_entries USING GIN(search);
CREATE INDEX IF NOT EXISTS idx_kb_status ON kb_entries(status, source);
CREATE UNIQUE INDEX IF NOT EXISTS idx_kb_server_key ON kb_entries(source_key) WHERE source = 'server';
