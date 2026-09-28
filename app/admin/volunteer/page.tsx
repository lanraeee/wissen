'use client'

import SimpleInboxList from '@/components/admin/SimpleInboxList'

export default function AdminVolunteer() {
  return (
    <SimpleInboxList
      resource="volunteer"
      title="Volunteer Applications"
      endpoint="/api/admin/volunteer"
      fields={[{ key: 'role', label: 'Role' }, { key: 'message', label: 'Message' }]}
      emptyLabel="No volunteer applications yet"
    />
  )
}
