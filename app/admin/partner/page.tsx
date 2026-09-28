'use client'

import SimpleInboxList from '@/components/admin/SimpleInboxList'

export default function AdminPartner() {
  return (
    <SimpleInboxList
      resource="partner"
      title="Partner Inquiries"
      endpoint="/api/admin/partner"
      fields={[
        { key: 'organisation', label: 'Organisation' },
        { key: 'partnership_type', label: 'Partnership Type' },
        { key: 'message', label: 'Message' },
      ]}
      emptyLabel="No partner inquiries yet"
    />
  )
}
