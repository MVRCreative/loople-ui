export interface AdminMessage {
  id: string
  senderName: string
  senderEmail: string
  subject: string
  preview: string
  content: string
  timestamp: string
  isUnread: boolean
  tags: string[]
  threadId: string
  replies: AdminMessageReply[]
}

export interface AdminMessageReply {
  id: string
  senderName: string
  senderEmail: string
  content: string
  timestamp: string
  isFromAdmin: boolean
}

export const mockAdminMessages: AdminMessage[] = [
  {
    id: '1',
    senderName: 'William Smith',
    senderEmail: 'williamsmith@example.com',
    subject: 'Meeting Tomorrow',
    preview: 'Hi team, I wanted to confirm our meeting tomorrow at 2 PM. Please come prepared with any questions you might have about the project.',
    content: `Hi team,

I wanted to confirm our meeting tomorrow at 2 PM. We'll be discussing the progress on the new feature implementation and reviewing the latest updates.

Please come prepared with any questions you might have about the project. I've attached the latest documentation for your review.

Looking forward to our discussion.

Best regards,
William`,
    timestamp: 'almost 2 years ago',
    isUnread: false,
    tags: ['meeting', 'work'],
    threadId: 'thread-1',
    replies: []
  },
  {
    id: '2',
    senderName: 'Alice Smith',
    senderEmail: 'alice.smith@company.com',
    subject: 'Re: Project Update',
    preview: 'Thanks for the update! The new features look great. I have a few suggestions for the user interface...',
    content: `Thanks for the update! The new features look great. I have a few suggestions for the user interface that I think would improve the user experience.

1. The navigation could be more intuitive
2. The color scheme might need some adjustments
3. We should consider adding more accessibility features

Let me know what you think about these suggestions.

Best,
Alice`,
    timestamp: 'over 2 years ago',
    isUnread: false,
    tags: ['feedback', 'ui'],
    threadId: 'thread-2',
    replies: []
  },
  {
    id: '3',
    senderName: 'Emily Davis',
    senderEmail: 'emily.davis@example.com',
    subject: 'Budget Request',
    preview: 'I need to request additional budget for the marketing campaign. The current allocation is not sufficient...',
    content: `Hi Admin Team,

I need to request additional budget for the marketing campaign. The current allocation is not sufficient to cover all the planned activities for this quarter.

Here's a breakdown of the additional costs:
- Social media advertising: $5,000
- Content creation: $3,000
- Event sponsorship: $2,000

Total additional request: $10,000

Please let me know if this is possible and what the approval process would be.

Thanks,
Emily`,
    timestamp: '3 days ago',
    isUnread: true,
    tags: ['budget', 'urgent'],
    threadId: 'thread-3',
    replies: []
  },
  {
    id: '4',
    senderName: 'Michael Wilson',
    senderEmail: 'm.wilson@company.com',
    subject: 'Technical Issue',
    preview: 'We\'re experiencing some technical difficulties with the new system. Users are reporting login issues...',
    content: `Hi Admin Team,

We're experiencing some technical difficulties with the new system. Users are reporting login issues and some features are not working as expected.

The main issues are:
- Login timeout errors
- Dashboard not loading properly
- Data synchronization problems

I've already contacted the development team, but I wanted to keep you informed. We're working on a fix and should have it resolved within 24 hours.

I'll keep you updated on the progress.

Best,
Michael`,
    timestamp: '1 week ago',
    isUnread: true,
    tags: ['technical', 'urgent'],
    threadId: 'thread-4',
    replies: []
  },
  {
    id: '5',
    senderName: 'Sarah Johnson',
    senderEmail: 'sarah.j@example.com',
    subject: 'Event Planning',
    preview: 'I\'m organizing the annual company event and need some guidance on the venue selection...',
    content: `Hello Admin Team,

I'm organizing the annual company event and need some guidance on the venue selection. We have a few options but I'm not sure which would be best for our needs.

The event details:
- Date: December 15th
- Expected attendees: 150-200 people
- Budget: $15,000
- Requirements: Catering, AV equipment, parking

I've shortlisted three venues:
1. Grand Hotel Conference Center
2. Community Center Downtown
3. Tech Hub Event Space

Could you help me evaluate these options? I need to make a decision by next week.

Thanks,
Sarah`,
    timestamp: '2 weeks ago',
    isUnread: false,
    tags: ['event', 'planning'],
    threadId: 'thread-5',
    replies: []
  },
  {
    id: '6',
    senderName: 'David Brown',
    senderEmail: 'david.brown@company.com',
    subject: 'Personal Request',
    preview: 'I need to request some time off for personal reasons. I\'d like to discuss the best way to handle this...',
    content: `Hi Admin Team,

I need to request some time off for personal reasons. I'd like to discuss the best way to handle this given my current project responsibilities.

I'm looking at taking 2-3 weeks off starting next month. I want to make sure my projects are properly handed off and that there's adequate coverage.

Could we schedule a meeting to discuss this? I'm available any time this week.

Thanks,
David`,
    timestamp: '3 weeks ago',
    isUnread: false,
    tags: ['personal', 'time-off'],
    threadId: 'thread-6',
    replies: []
  }
]
