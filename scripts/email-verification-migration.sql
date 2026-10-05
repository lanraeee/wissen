-- Paste this whole file into the Neon SQL Editor and run it once, BEFORE the
-- email verification change is deployed (the new code reads these columns).
-- It is a single DO block, so the editor accepts it as one command.
-- Safe to re-run: every statement is IF NOT EXISTS or a no-op the second time.
-- The same statements live in lib/schema.sql for scripts/migrate.mjs.
DO $migration$
BEGIN
-- Adding the column with DEFAULT NOW() stamps every existing account as
-- verified, so nobody who can sign in today is locked out. Dropping the
-- default straight after means accounts created from now on start
-- unverified until their owner clicks the emailed link.
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE users ALTER COLUMN email_verified_at DROP DEFAULT;

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user ON email_verification_tokens(user_id);
END
$migration$;
