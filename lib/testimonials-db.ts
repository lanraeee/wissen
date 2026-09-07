import sql from '@/lib/db'

export async function ensureTestimonialsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS testimonials (
      id          SERIAL PRIMARY KEY,
      name        TEXT NOT NULL,
      role        TEXT,
      quote       TEXT NOT NULL,
      avatar_url  TEXT,
      rating      INTEGER,
      source      TEXT NOT NULL DEFAULT 'admin' CHECK (source IN ('admin','candidate')),
      status      TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending','approved','rejected')),
      featured    BOOLEAN NOT NULL DEFAULT false,
      user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
      sort_order  INTEGER NOT NULL DEFAULT 0,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  const [{ c }] = await sql`SELECT COUNT(*) AS c FROM testimonials`
  if (Number(c) === 0) {
    await sql`
      INSERT INTO testimonials (name, role, quote, rating, source, status, featured, sort_order) VALUES
      ('Chidi Okoro', 'Senior Secondary Student & Volunteer', 'The search for real results is over at last. Wissen-Haus showed me a path I didn''t know existed.', 5, 'admin', 'approved', true, 1),
      ('Amara Nwosu', 'SS3 Student, Command Secondary School', 'Before the Career Clarity Fair I had no idea what I wanted to do after school. Now I have a plan and mentors I can actually talk to.', 5, 'admin', 'approved', false, 2),
      ('Tobi Adewale', 'Career Clarity Fair Attendee', 'Meeting professionals face to face changed everything for me. I finally understand what a career in tech really looks like day to day.', 5, 'admin', 'approved', false, 3),
      ('Fatima Bello', 'Scholarship Recipient', 'The Opportunity Hub helped me find and apply for a scholarship I would never have heard about otherwise. Forever grateful.', 5, 'admin', 'approved', false, 4),
      ('Emeka Obi', 'Career Launch Blueprint Graduate', 'The free courses gave me real, practical skills — CV writing, interviews, networking. I felt ready for the working world for the first time.', 4, 'admin', 'approved', false, 5)
    `
  }
}
