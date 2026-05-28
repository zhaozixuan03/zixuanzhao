import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

export const supabase = createClient(url, key)

export type Visibility = 'public' | 'private'

export interface Post {
  id: string
  title: string | null
  content: string        // HTML from Tiptap
  content_text: string   // plain text for preview/word count
  visibility: Visibility
  slug: string
  image_urls: string[]   // extracted image URLs from content
  card_color: string | null
  tags: string[] | null
  created_at: string
  updated_at: string
}

export interface Photo {
  id: string
  url: string
  caption: string | null
  post_id: string | null
  created_at: string
}
