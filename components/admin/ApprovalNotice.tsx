// Shown to editors above any screen that writes site_content. Their save
// creates a proposal rather than publishing, and the individual editor
// components still report it as saved -- this is what tells them where the
// change actually went.
export default function ApprovalNotice() {
  return (
    <div style={{
      background: '#fff8e6', border: '1px solid #f0dfae', borderRadius: 10,
      padding: '14px 18px', marginBottom: 24, fontSize: '.86rem', color: '#5c4a12',
    }}>
      <strong>Your changes are submitted for approval.</strong> Saving here sends the change to a
      director rather than publishing it. Nothing goes live on the site until it is approved — you
      can follow yours under <a href="/admin/content-approvals" style={{ color: '#5c4a12', fontWeight: 700 }}>Content Approvals</a>.
    </div>
  )
}
