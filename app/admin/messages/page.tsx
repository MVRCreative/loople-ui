'use client'

import { useState } from 'react'
import { AdminMessagesList } from '@/components/admin/messages-list'
import { AdminMessageDetail } from '@/components/admin/message-detail'
import { AdminLayoutWrapper } from '@/components/admin/admin-layout-wrapper'

export default function AdminMessagesPage() {
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)

  return (
    <AdminLayoutWrapper>
      <div className="flex flex-1 overflow-hidden">
        {/* Left Column - Messages List */}
        <div className="w-1/3 border-r border-border">
          <AdminMessagesList
            onSelectMessage={setSelectedMessageId}
            selectedMessageId={selectedMessageId}
          />
        </div>

        {/* Right Column - Message Detail */}
        <div className="flex-1">
          <AdminMessageDetail
            messageId={selectedMessageId}
            onClose={() => setSelectedMessageId(null)}
          />
        </div>
      </div>
    </AdminLayoutWrapper>
  )
}
