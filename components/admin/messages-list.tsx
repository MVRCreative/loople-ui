'use client'

import { useState } from 'react'
import { Search, MoreVertical } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { mockAdminMessages, AdminMessage } from '@/lib/mocks/admin-messages'
import { cn } from '@/lib/utils'

interface AdminMessagesListProps {
  onSelectMessage: (messageId: string) => void
  selectedMessageId: string | null
}

export function AdminMessagesList({ onSelectMessage, selectedMessageId }: AdminMessagesListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [messages] = useState<AdminMessage[]>(mockAdminMessages)

  const filteredMessages = messages.filter(message =>
    message.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    message.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    message.preview.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatTimestamp = (timestamp: string) => {
    return timestamp
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Search Bar */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background border-border focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {filteredMessages.map((message) => (
            <div
              key={message.id}
              onClick={() => onSelectMessage(message.id)}
              className={cn(
                'p-4 rounded-lg cursor-pointer transition-colors mb-2 border',
                selectedMessageId === message.id
                  ? 'bg-muted/50 border-border'
                  : 'border-transparent hover:bg-muted/30 hover:border-border/50'
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground text-sm">
                    {message.senderName}
                  </h3>
                  {message.isUnread && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(message.timestamp)}
                  </span>
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <h4 className="font-medium text-foreground text-sm mb-1">
                {message.subject}
              </h4>

              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {message.preview}
              </p>

              <div className="flex flex-wrap gap-1">
                {message.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-xs bg-muted text-muted-foreground hover:bg-muted/80"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
