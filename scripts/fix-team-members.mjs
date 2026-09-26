import { neon } from '@neondatabase/serverless'
import sharp from 'sharp'

// Updated role titles as given by the user.
const ROLE_UPDATES = {
  Christine: 'Operations & Administration Manager',
  Damola: 'Fundraising & Grants Officer',
  Gbemisola: 'Programmes & Partnerships Director',
  Ope: 'Communications & Creative Lead',
  Zaki: 'Community & Impact Officer',
  Lanre: 'Information & Communications Technology Operations Director',
}

async function resizePhoto(dataUrl, maxDim = 400) {
  const match = /^data:(image\/\w+);base64,(.+)$/.exec(dataUrl)
  if (!match) return dataUrl
  const buffer = Buffer.from(match[2], 'base64')
  // These are headshot photos, not logos -- no transparency to preserve, so
  // always re-encode as JPEG. PNG is lossless and barely shrinks a real
  // photograph; JPEG at 400px/quality 82 is a fraction of the size.
  const resized = await sharp(buffer)
    .resize(maxDim, maxDim, { fit: 'inside', withoutEnlargement: true })
    .flatten({ background: '#ffffff' })
    .jpeg({ quality: 82 })
    .toBuffer()
  return `data:image/jpeg;base64,${resized.toString('base64')}`
}

async function main() {
  const databaseUrl = process.env.WISSENDB_DATABASE_URL_UNPOOLED
  if (!databaseUrl) { console.error('missing db url'); process.exit(1) }
  const sql = neon(databaseUrl)

  const rows = await sql`SELECT value FROM site_content WHERE key = 'team_members'`
  const members = rows[0]?.value ?? []

  const updated = await Promise.all(members.map(async m => {
    const newRole = ROLE_UPDATES[m.name]
    const photo = m.photo ? await resizePhoto(m.photo) : m.photo
    if (m.photo) console.log(`${m.name}: photo ${m.photo.length} -> ${photo.length} bytes`)
    return { ...m, role: newRole ?? m.role, photo }
  }))

  const newSize = JSON.stringify(updated).length
  console.log('new payload size (bytes):', newSize)
  if (newSize > 500_000) {
    console.error('Still over the 500KB cap -- aborting without writing.')
    process.exit(1)
  }

  await sql`
    INSERT INTO site_content (key, value, updated_at)
    VALUES ('team_members', ${JSON.stringify(updated)}, NOW())
    ON CONFLICT (key) DO UPDATE SET value = ${JSON.stringify(updated)}, updated_at = NOW()
  `
  console.log('✓ team_members updated: roles corrected, photos resized in place')
}

main().catch(err => { console.error(err.message); process.exit(1) })
