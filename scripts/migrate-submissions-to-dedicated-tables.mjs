// One-off backfill: copies existing rows out of the generic `submissions`
// table into the new dedicated tables (contact_messages, volunteer_applications,
// partner_inquiries, donations, bank_transfers). Run once, after
// `node scripts/migrate.mjs` has created the new tables, and before deploying
// code that stops writing to `submissions`.
//
// Idempotent: every insert uses ON CONFLICT DO NOTHING keyed on the row's
// original id (or, for donations/bank_transfers, the payment reference), so
// running this again is a safe no-op for rows already copied.
import { neon } from '@neondatabase/serverless'

async function main() {
  const databaseUrl = process.env.WISSENDB_DATABASE_URL_UNPOOLED ?? process.env.WISSENDB_DATABASE_URL ?? process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('Error: WISSENDB_DATABASE_URL env var not found.')
    console.error('Run: vercel env pull .env.local --yes  then try again.')
    process.exit(1)
  }
  const sql = neon(databaseUrl)

  console.log('Backfilling dedicated tables from submissions...')

  const contact = await sql`SELECT id, name, email, data, status, created_at FROM submissions WHERE type = 'contact'`
  for (const r of contact) {
    await sql`
      INSERT INTO contact_messages (id, name, email, subject, message, status, created_at)
      VALUES (${r.id}, ${r.name}, ${r.email}, ${r.data?.subject ?? ''}, ${r.data?.message ?? ''}, ${r.status ?? 'pending'}, ${r.created_at})
      ON CONFLICT (id) DO NOTHING
    `
  }
  console.log(`✓ contact_messages: ${contact.length} rows`)

  const volunteer = await sql`SELECT id, name, email, data, status, created_at FROM submissions WHERE type = 'volunteer'`
  for (const r of volunteer) {
    await sql`
      INSERT INTO volunteer_applications (id, name, email, role, message, status, created_at)
      VALUES (${r.id}, ${r.name}, ${r.email}, ${r.data?.role ?? ''}, ${r.data?.message ?? null}, ${r.status ?? 'pending'}, ${r.created_at})
      ON CONFLICT (id) DO NOTHING
    `
  }
  console.log(`✓ volunteer_applications: ${volunteer.length} rows`)

  // partnership_type was never stored under the old generic route -- there's
  // nothing to backfill it from, so existing rows come across with it null.
  const partner = await sql`SELECT id, name, email, data, status, created_at FROM submissions WHERE type = 'partner'`
  for (const r of partner) {
    await sql`
      INSERT INTO partner_inquiries (id, name, email, organisation, partnership_type, message, status, created_at)
      VALUES (${r.id}, ${r.name}, ${r.email}, ${r.data?.organisation ?? ''}, NULL, ${r.data?.message ?? null}, ${r.status ?? 'pending'}, ${r.created_at})
      ON CONFLICT (id) DO NOTHING
    `
  }
  console.log(`✓ partner_inquiries: ${partner.length} rows`)

  const donations = await sql`SELECT id, name, email, data, created_at FROM submissions WHERE type = 'donation'`
  let donationCount = 0
  for (const r of donations) {
    const reference = r.data?.reference
    if (!reference) continue
    const certId = `WH-DON-${String(reference).replace(/[^a-zA-Z0-9]/g, '').slice(-10).toUpperCase()}`
    await sql`
      INSERT INTO donations (id, name, email, amount, currency, reference, provider, cert_id, created_at)
      VALUES (${r.id}, ${r.name}, ${r.email}, ${r.data.amount}, ${r.data.currency}, ${reference}, ${r.data.provider}, ${certId}, ${r.created_at})
      ON CONFLICT (reference) DO NOTHING
    `
    donationCount++
  }
  console.log(`✓ donations: ${donationCount} rows`)

  const pledges = await sql`SELECT id, name, email, data, created_at FROM submissions WHERE type = 'bank_transfer'`
  for (const r of pledges) {
    const d = r.data ?? {}
    await sql`
      INSERT INTO bank_transfers (id, reference, name, email, amount, currency, message, status, declared_at, confirmed_at, created_at)
      VALUES (
        ${r.id}, ${d.reference}, ${r.name}, ${r.email}, ${d.amount}, ${d.currency}, ${d.message ?? null},
        ${d.status ?? 'awaiting_transfer'}, ${d.declared_at ?? null}, ${d.confirmed_at ?? null}, ${r.created_at}
      )
      ON CONFLICT (reference) DO NOTHING
    `
  }
  console.log(`✓ bank_transfers: ${pledges.length} rows`)

  const linked = await sql`
    UPDATE bank_transfers bt SET donation_id = d.id
    FROM donations d
    WHERE bt.reference = d.reference AND bt.status = 'confirmed' AND bt.donation_id IS NULL
    RETURNING bt.id
  `
  console.log(`✓ linked ${linked.length} confirmed bank transfers to their donation row`)

  console.log('\n✓ Backfill complete!')
}

main()
