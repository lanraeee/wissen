'use client'

import DocumentsPanel from './DocumentsPanel'

export default function DocumentsTab() {
  return (
    <div>
      <h2 style={{ margin: '0 0 4px', fontSize: '1.1rem' }}>Documents</h2>
      <p style={{ margin: '0 0 20px', fontSize: '.8rem', color: '#8a9a8f' }}>
        Every file in the CIO record, including those attached on other tabs. Signed constitution, trustee ID and acceptance forms, minutes and policies.
        Files are private to directors and served only through this panel.
      </p>
      <DocumentsPanel categories />
    </div>
  )
}
