-- Paste this whole file into the Neon SQL Editor and run it once.
-- It is a single DO block, so the editor accepts it as one command.
-- Safe to re-run: every statement is IF NOT EXISTS.
DO $migration$
BEGIN
CREATE TABLE IF NOT EXISTS cio_constitution_versions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_label  TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','adopted','superseded')),
  body_text      TEXT,
  adopted_date   DATE,
  change_summary TEXT,
  created_by     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cio_registrations (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  authority          TEXT NOT NULL CHECK (authority IN ('charity_commission','companies_house','cac','tin','other')),
  entity_name        TEXT NOT NULL,
  reg_number         TEXT,
  status             TEXT,
  registered_date    DATE,
  registered_address TEXT,
  notes              TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cio_meetings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_date DATE NOT NULL,
  meeting_type TEXT NOT NULL CHECK (meeting_type IN ('trustee','general','written_resolution')),
  title        TEXT NOT NULL,
  location     TEXT,
  status       TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','held','cancelled')),
  attendees    TEXT,
  minutes      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cio_meetings_date ON cio_meetings(meeting_date DESC);

CREATE TABLE IF NOT EXISTS cio_declarations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trustee_id       UUID NOT NULL REFERENCES trustee_register(id) ON DELETE CASCADE,
  declaration_year INTEGER NOT NULL,
  declared_on      DATE NOT NULL,
  has_conflicts    BOOLEAN NOT NULL DEFAULT FALSE,
  details          TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (trustee_id, declaration_year)
);

CREATE TABLE IF NOT EXISTS cio_policies (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  category     TEXT,
  owner        TEXT,
  status       TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','adopted','under_review','retired')),
  adopted_date DATE,
  review_date  DATE,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cio_filings (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT NOT NULL,
  authority      TEXT,
  due_date       DATE NOT NULL,
  status         TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming','submitted','not_required')),
  submitted_date DATE,
  reference      TEXT,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cio_filings_due ON cio_filings(due_date);

CREATE TABLE IF NOT EXISTS cio_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  category        TEXT,
  linked_type     TEXT,
  linked_id       UUID,
  blob_path       TEXT NOT NULL,
  file_name       TEXT NOT NULL,
  content_type    TEXT,
  size_bytes      INTEGER,
  is_working_copy BOOLEAN NOT NULL DEFAULT FALSE,
  notes           TEXT,
  uploaded_by     TEXT,
  drive_status    TEXT NOT NULL DEFAULT 'pending' CHECK (drive_status IN ('pending','synced','failed','disabled')),
  drive_file_id   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cio_documents_link ON cio_documents(linked_type, linked_id);
END
$migration$;
