-- Paste this whole file into the Neon SQL Editor and run it once, AFTER whf-cio-migration.sql.
-- It is a single DO block (one command) and is safe to re-run: each row is only added if it is not already there.
-- It is deliberately small: the Neon editor cuts off large pastes. The constitution text is loaded in the
-- dashboard instead (Constitution tab, New version), see docs/foundation-cio/03_Constitution_DRAFT.md.
--
--   Policies tab       : Safeguarding Policy, Grant-Making Policy (draft until adopted)
--   Registrations tab  : Charity Commission application 5300610
--   Filings tab        : first annual return and accounts
DO $seed$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cio_policies WHERE title = 'Safeguarding Policy') THEN
    INSERT INTO cio_policies (title, category, status, review_date, notes)
    VALUES ('Safeguarding Policy', 'Safeguarding', 'draft', DATE '2027-10-03',
            'Published at wissenhaus.org/safeguarding. Trustees to adopt it and appoint a Designated Safeguarding Lead and deputy, then set status to Adopted.');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM cio_policies WHERE title = 'Grant-Making Policy') THEN
    INSERT INTO cio_policies (title, category, status, review_date, notes)
    VALUES ('Grant-Making Policy', 'Finance and governance', 'draft', DATE '2027-10-03',
            'Draft in docs/foundation-cio/06_Grant_Making_Policy.md. Fill the bracketed amounts, then trustees adopt it.');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM cio_registrations WHERE authority = 'charity_commission' AND reg_number IS NULL) THEN
    INSERT INTO cio_registrations (authority, entity_name, status, registered_address, notes)
    VALUES ('charity_commission', 'Wissen Haus Foundation', 'Application 5300610 in progress',
            'Co-working space, 190 Dantzic Street, Manchester M4 4LF',
            'Application reference 5300610. Add the charity registration number when registered.');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM cio_filings WHERE title = 'First annual return and accounts (year ending 31 March 2027)') THEN
    INSERT INTO cio_filings (title, authority, due_date, status, notes)
    VALUES ('First annual return and accounts (year ending 31 March 2027)', 'Charity Commission', DATE '2028-01-31', 'upcoming',
            'Normally due within 10 months of the financial year end. Check the Commission''s guidance once registered.');
  END IF;
END
$seed$;
