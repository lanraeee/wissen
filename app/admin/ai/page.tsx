import type { Metadata } from 'next'
import { getSession } from '@/lib/auth'
import { isMasterAdmin } from '@/lib/admin-guard'
import { canUseAdminAgent, getAiSettings } from '@/lib/ai-settings'
import NoAccess from '@/components/admin/NoAccess'
import AiAgentConsole from '@/components/admin/AiAgentConsole'

export const metadata: Metadata = { title: 'AI Agent · Admin · Wissen-Haus' }
export const dynamic = 'force-dynamic'

export default async function AdminAiPage() {
  const session = await getSession()
  if (!await canUseAdminAgent(session?.email)) return <NoAccess section="AI Agent" />

  const master = isMasterAdmin(session?.email)
  const settings = await getAiSettings()

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <h1 className="admin-page-title">AI Agent</h1>
        <p className="admin-page-desc">
          Ask questions about the organisation&apos;s data. The agent reads the database
          directly and can also draft, analyse and plan. It cannot change anything, send
          anything, or reach the internet.
        </p>
      </div>
      <AiAgentConsole
        isMaster={master}
        enabled={settings.adminAgentEnabled}
        allowedEmails={settings.adminAgentAllowedEmails}
      />
    </>
  )
}
