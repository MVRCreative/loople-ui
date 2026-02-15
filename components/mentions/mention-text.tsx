"use client"

/**
 * MentionText — Renders text with @mentions highlighted and linked.
 */

import Link from "next/link"
import { segmentMentions } from "@/lib/services/mentions.service"

interface MentionTextProps {
  text: string
  className?: string
}

export function MentionText({ text, className = "" }: MentionTextProps) {
  const segments = segmentMentions(text)

  return (
    <span className={className}>
      {segments.map((segment, idx) => {
        if (segment.type === "mention") {
          return (
            <Link
              key={idx}
              href={`/profile/${segment.value}`}
              className="text-primary hover:underline font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              @{segment.value}
            </Link>
          )
        }
        return <span key={idx}>{segment.value}</span>
      })}
    </span>
  )
}
