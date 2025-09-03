export type Conversation = {
  id: string
  name: string
  handle: string
  avatarUrl?: string
  lastMessage: string
  lastTimestamp: string
  unread?: boolean
}

export type Message = {
  id: string
  conversationId: string
  sender: "me" | "them"
  text: string
  timestamp: string
}

export const mockConversations: Conversation[] = [
  {
    id: "marco",
    name: "Marco Cornacchia",
    handle: "@marcofyl",
    avatarUrl: undefined,
    lastMessage: "I sent him Turf and I think he'd be a great person...",
    lastTimestamp: "11:33 PM",
    unread: true,
  },
  {
    id: "riley",
    name: "Riley Hennigh",
    handle: "@rileyhennigh",
    lastMessage: "we've also not connected in a couple of years...",
    lastTimestamp: "Jul 21",
  },
  {
    id: "emily",
    name: "Emily Lonetto",
    handle: "@EmilyLonetto",
    lastMessage: "Amazing!",
    lastTimestamp: "Jul 14",
  },
]

export const mockMessages: Message[] = [
  {
    id: "m1",
    conversationId: "marco",
    sender: "me",
    text: "hey man! dude very excited about Turf!",
    timestamp: "11:31 PM",
  },
  {
    id: "m2",
    conversationId: "marco",
    sender: "me",
    text:
      "I'm not great at football stuff, but I showed my brother who is like a football analytics nerd...",
    timestamp: "11:33 PM",
  },
  {
    id: "m3",
    conversationId: "riley",
    sender: "me",
    text: "Hey!",
    timestamp: "Jul 21",
  },
]


