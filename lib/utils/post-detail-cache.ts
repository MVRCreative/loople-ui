import type { Post } from '@/lib/types'

const PREFIX = 'loople_post_detail_v1_'

export function postStatusPath(postId: string): string {
  return `/status/${postId}`
}

export function postDetailSessionKey(postId: string): string {
  return `${PREFIX}${postId}`
}

/** Cache feed post for instant post-detail UI (session only). */
export function cachePostForDetail(post: Post): void {
  if (typeof window === 'undefined' || post.isOptimistic) return
  try {
    sessionStorage.setItem(postDetailSessionKey(post.id), JSON.stringify(post))
  } catch {
    /* quota / private mode */
  }
}

export function readCachedPostForDetail(postId: string): Post | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(postDetailSessionKey(postId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as Post
    if (!parsed || String(parsed.id) !== String(postId)) return null
    return parsed
  } catch {
    return null
  }
}
