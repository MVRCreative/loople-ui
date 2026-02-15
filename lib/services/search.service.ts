import { supabase } from '../supabase'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PostSearchResult {
  id: number
  club_id: number
  body: string
  kind: string
  created_at: string
  author: {
    id: number
    first_name: string
    last_name: string
    user_id: string
  } | null
  author_user?: {
    id: string
    username: string | null
    avatar_url: string | null
  } | null
}

export interface MemberSearchResult {
  user_id: string
  first_name: string
  last_name: string
  username: string | null
  avatar_url: string | null
}

export interface SearchResults {
  posts: PostSearchResult[]
  members: MemberSearchResult[]
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

class SearchService {
  /**
   * Full-text search across posts using the generated tsvector column.
   */
  async searchPosts(query: string, clubId?: number, limit = 20): Promise<PostSearchResult[]> {
    // Convert user query to tsquery format: "hello world" → "hello & world"
    const tsQuery = query
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .join(' & ')

    if (!tsQuery) return []

    let dbQuery = supabase
      .from('posts')
      .select(`
        id,
        club_id,
        body,
        kind,
        created_at,
        author:members!posts_author_member_id_fkey (
          id, first_name, last_name, user_id
        )
      `)
      .textSearch('search_vector', tsQuery, { type: 'plain' })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (clubId) {
      dbQuery = dbQuery.eq('club_id', clubId)
    }

    const { data, error } = await dbQuery

    if (error) {
      console.error('Post search failed:', error)
      return []
    }

    // Fetch user profiles for authors
    const userIds = [
      ...new Set(
        (data ?? [])
          .map((p) => {
            const author = p.author as { user_id?: string } | null
            return author?.user_id
          })
          .filter(Boolean) as string[]
      ),
    ]

    let usersMap: Record<string, { id: string; username: string | null; avatar_url: string | null }> = {}
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, username, avatar_url')
        .in('id', userIds)

      if (users) {
        usersMap = Object.fromEntries(users.map((u) => [u.id, u]))
      }
    }

    return (data ?? []).map((row) => {
      // Supabase returns the joined relation as an object (single FK) or array; normalize
      const rawAuthor = row.author as unknown
      const author = Array.isArray(rawAuthor) ? rawAuthor[0] as { id: number; first_name: string; last_name: string; user_id: string } | undefined : rawAuthor as { id: number; first_name: string; last_name: string; user_id: string } | null
      return {
        id: row.id,
        club_id: row.club_id,
        body: row.body,
        kind: row.kind,
        created_at: row.created_at,
        author: author ?? null,
        author_user: author?.user_id ? usersMap[author.user_id] ?? null : null,
      }
    })
  }

  /**
   * Search members by name/username within a club.
   */
  async searchMembers(query: string, clubId: number, limit = 10): Promise<MemberSearchResult[]> {
    const searchTerm = `%${query}%`

    const { data: members, error } = await supabase
      .from('members')
      .select('user_id, first_name, last_name')
      .eq('club_id', clubId)
      .or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm}`)
      .limit(limit)

    if (error || !members) return []

    const userIds = members.map((m) => m.user_id).filter(Boolean) as string[]
    if (userIds.length === 0) return []

    const { data: users } = await supabase
      .from('users')
      .select('id, first_name, last_name, username, avatar_url')
      .in('id', userIds)

    return (users ?? []).map((u) => ({
      user_id: u.id,
      first_name: u.first_name,
      last_name: u.last_name,
      username: u.username,
      avatar_url: u.avatar_url,
    }))
  }

  /**
   * Combined search: posts + members.
   */
  async search(query: string, clubId?: number): Promise<SearchResults> {
    const [posts, members] = await Promise.all([
      this.searchPosts(query, clubId),
      clubId ? this.searchMembers(query, clubId) : Promise.resolve([]),
    ])

    return { posts, members }
  }
}

export const searchService = new SearchService()
