import type { Metadata } from 'next'
import { adminRole } from '@/lib/admin-guard'
import ContentApprovals from '@/components/admin/ContentApprovals'

export const metadata: Metadata = { title: 'Content Approvals · Admin · Wissen-Haus' }

export default async function AdminContentApprovals() {
  // Editors reach this page to track what they submitted; only directors get
  // the Approve and Reject controls, matching the API.
  const canReview = await adminRole() === 'director'

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <h1 className="admin-page-title">Content Approvals</h1>
        <p className="admin-page-desc">
          {canReview
            ? 'Content changes submitted by editors. Nothing here is public until you approve it.'
            : 'Content changes you have submitted. A director publishes them after review.'}
        </p>
      </div>
      <ContentApprovals canReview={canReview} />
    </>
  )
}
