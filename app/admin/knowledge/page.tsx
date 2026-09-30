import type { Metadata } from 'next'
import { adminRole } from '@/lib/admin-guard'
import KnowledgeBaseManager from '@/components/admin/KnowledgeBaseManager'

export const metadata: Metadata = { title: 'Knowledge Base · Admin · Wissen-Haus' }
export const dynamic = 'force-dynamic'

export default async function AdminKnowledgePage() {
  const canEdit = await adminRole() === 'director'

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <h1 className="admin-page-title">Knowledge Base</h1>
        <p className="admin-page-desc">
          What the support assistant answers from. Server entries rebuild nightly from live
          site data. Answers written by the team need approving before the assistant may
          reuse them.
        </p>
      </div>
      <KnowledgeBaseManager canEdit={canEdit} />
    </>
  )
}
