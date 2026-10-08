export const metadata = { title: 'No access yet · Admin · Wissen-Haus' }

export default function NoAccessPage() {
  return (
    <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center' }}>
      <h1 style={{ fontSize: '1.3rem', marginBottom: 12 }}>No sections granted yet</h1>
      <p style={{ color: '#8a9a8f', fontSize: '.95rem' }}>
        Your account is set up, but the master admin hasn&apos;t granted you access to any part of the admin dashboard yet.
        Ask them to open Access Control and grant you a section.
      </p>
    </div>
  )
}
