// Shown when a signed-in staff member reaches an admin section their role does
// not cover. The nav already hides these, so this is the direct-URL path (a
// bookmark, a shared link, a typed address) -- it exists so that case ends in a
// sentence rather than in a rendered page whose API calls all 403 behind it.
export default function NoAccess({ section }: { section: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: 10, padding: 40, boxShadow: '0 1px 4px rgba(0,0,0,.06)', maxWidth: 560 }}>
      <h1 className="admin-page-title" style={{ marginBottom: 10 }}>{section} is not available to your account</h1>
      <p className="admin-page-desc" style={{ marginBottom: 0 }}>
        This section is limited to directors and administrators. If you need access to it,
        ask a director to change your role.
      </p>
    </div>
  )
}
