'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { mockAdminMessages, AdminMessage } from '@/lib/mocks/admin-messages'
import { cn } from '@/lib/utils'

interface AdminMessageDetailProps {
  messageId: string | null
  onClose: () => void
}

export function AdminMessageDetail({ messageId, onClose }: AdminMessageDetailProps) {
  const [replyText, setReplyText] = useState('')
  const [isMuted, setIsMuted] = useState(false)

  const message = messageId ? mockAdminMessages.find(m => m.id === messageId) : null

  if (!message) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="text-center">
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            No message selected
          </h3>
          <p className="text-sm text-muted-foreground">
            Select a message from the list to view its content
          </p>
        </div>
      </div>
    )
  }

  const handleSendReply = () => {
    if (replyText.trim()) {
      // TODO: Implement send reply functionality
      console.log('Sending reply:', replyText)
      setReplyText('')
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Message Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <span className="text-sm font-medium text-muted-foreground">
              {getInitials(message.senderName)}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground mb-1">
              {message.senderName}
            </h2>
            <h3 className="text-base font-medium text-foreground mb-2">
              {message.subject}
            </h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Reply-To: {message.senderEmail}</span>
              <span>{message.timestamp}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Message Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="prose prose-sm max-w-none text-foreground">
          <div className="whitespace-pre-wrap leading-relaxed">
            {message.content}
          </div>
        </div>
      </div>

      {/* Reply Section */}
      <div className="p-6 border-t border-border bg-muted/20">
        <div className="space-y-4">
          <Textarea
            placeholder={`Reply ${message.senderName}...`}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="min-h-[100px] bg-background border-border resize-none focus:ring-2 focus:ring-blue-500"
          />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="mute-thread"
                checked={isMuted}
                onCheckedChange={setIsMuted}
              />
              <Label htmlFor="mute-thread" className="text-sm text-muted-foreground">
                Mute this thread
              </Label>
            </div>
            
            <Button
              onClick={handleSendReply}
              disabled={!replyText.trim()}
              className="bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
