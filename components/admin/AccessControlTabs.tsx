'use client'

import { useState } from 'react'
import AccessControlEditor from './AccessControlEditor'
import CurrentPermissions from './CurrentPermissions'
import RolesManager from './RolesManager'

const TABS = [
  { id: 'current', label: 'Current permissions' },
  { id: 'trustees', label: 'Trustee logins' },
  { id: 'roles', label: 'Roles (RBAC)' },
] as const

type TabId = (typeof TABS)[number]['id']

export default function AccessControlTabs() {
  const [tab, setTab] = useState<TabId>('current')
  return (
    <div>
      <div role="tablist" style={{ display: 'flex', gap: 4, flexWrap: 'wrap', borderBottom: '1px solid #e8e4dc', marginBottom: 20 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '9px 16px', fontSize: '.85rem', fontWeight: 600, cursor: 'pointer', background: 'transparent', border: 'none',
              borderBottom: `2px solid ${tab === t.id ? '#1a3c2e' : 'transparent'}`, color: tab === t.id ? '#1a3c2e' : '#8a9a8f', marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'current' && <CurrentPermissions />}
      {tab === 'trustees' && <AccessControlEditor />}
      {tab === 'roles' && <RolesManager />}
    </div>
  )
}
