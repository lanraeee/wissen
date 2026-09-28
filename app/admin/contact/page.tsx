'use client'

import SimpleInboxList from '@/components/admin/SimpleInboxList'

export default function AdminContact() {
  return (
    <SimpleInboxList
      resource="contact"
      title="Contact Messages"
      endpoint="/api/admin/contact"
      fields={[{ key: 'subject', label: 'Subject' }, { key: 'message', label: 'Message' }]}
      emptyLabel="No contact messages yet"
    />
  )
}
