import sql from '../lib/db.js'

async function seedTrustees() {
  try {
    console.log('Seeding initial trustees...')

    const trustees = [
      {
        full_name: 'Benz Olagbaye',
        position_title: 'Founder & Executive Director',
        email: 'benz@wissenhaus.org',
        phone: null,
        date_of_birth: null,
        appointment_date: '2026-10-03',
        term_end_date: '2030-10-03',
        appointment_type: 'ex_officio',
        nominating_org: null,
        status: 'active',
        notes: 'Founding trustee, ex officio by virtue of Executive Director role',
      },
      {
        full_name: 'Fawaz Bello',
        position_title: 'ICT Operations Director',
        email: 'fawaz@wissenhaus.org',
        phone: null,
        date_of_birth: null,
        appointment_date: '2026-10-03',
        term_end_date: '2029-10-03',
        appointment_type: 'appointed',
        nominating_org: null,
        status: 'active',
        notes: 'Appointed trustee',
      },
      {
        full_name: 'Gbemisola Abatan',
        position_title: 'Programmes & Partnerships Director',
        email: 'gbemisola@wissenhaus.org',
        phone: null,
        date_of_birth: null,
        appointment_date: '2026-10-03',
        term_end_date: '2029-10-03',
        appointment_type: 'appointed',
        nominating_org: null,
        status: 'active',
        notes: 'Appointed trustee',
      },
    ]

    for (const trustee of trustees) {
      await sql`
        INSERT INTO trustee_register (
          full_name,
          position_title,
          email,
          phone,
          date_of_birth,
          appointment_date,
          term_end_date,
          appointment_type,
          nominating_org,
          status,
          notes
        ) VALUES (
          ${trustee.full_name},
          ${trustee.position_title},
          ${trustee.email},
          ${trustee.phone},
          ${trustee.date_of_birth},
          ${trustee.appointment_date},
          ${trustee.term_end_date},
          ${trustee.appointment_type},
          ${trustee.nominating_org},
          ${trustee.status},
          ${trustee.notes}
        )
        ON CONFLICT DO NOTHING
      `
      console.log(`✓ Added ${trustee.full_name}`)
    }

    const result = await sql`SELECT COUNT(*) as count FROM trustee_register`
    console.log(`\n✅ Seed complete. Total trustees: ${result[0].count}`)
  } catch (err) {
    console.error('Error seeding trustees:', err)
    process.exit(1)
  }
}

seedTrustees()
