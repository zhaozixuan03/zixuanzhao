import { supabase } from '@/lib/supabase'
import { isAuthenticated } from '@/lib/auth'
import { countWords } from '@/lib/utils'
import ContributionGrid from '@/components/ContributionGrid'
import MasonryGallery from '@/components/MasonryGallery'
import Nav from '@/components/Nav'
import HeroQuote from '@/components/HeroQuote'
import PostsGrid from '@/components/PostsGrid'

export const revalidate = 0

async function getData(authed: boolean) {
  const visFilter = authed ? ['public', 'private'] : ['public']
  const [postsRes, photosRes] = await Promise.all([
    supabase.from('posts').select('*').in('visibility', visFilter).order('created_at', { ascending: false }),
    supabase.from('photos').select('*').is('post_id', null).order('created_at', { ascending: false }),
  ])
  return { posts: postsRes.data || [], photos: photosRes.data || [] }
}

export default async function Home() {
  const authed = await isAuthenticated()
  const { posts, photos } = await getData(authed)

  const now = new Date()
  const dateStr = `${now.getFullYear()} · ${String(now.getMonth() + 1).padStart(2, '0')} · ${String(now.getDate()).padStart(2, '0')}`
  const postDates = posts.map((p: any) => p.created_at)
  const totalWords = posts.reduce((sum: number, p: any) => sum + countWords(p.content_text || ''), 0)
  const allTags: string[] = [...new Set(posts.flatMap((p: any) => p.tags || []))].sort() as string[]

  return (
    <div className="pb-20">
      {/* Nav */}
      <div className="max-w-[860px] mx-auto px-6 md:px-16">
        <Nav isAuthed={authed} />
      </div>

      {/* Hero */}
      <div className="max-w-[860px] mx-auto px-6 md:px-16">
        <HeroQuote
          dateStr={dateStr}
          posts={posts.map((p: any) => ({ id: p.id, title: p.title, content_text: p.content_text || '' }))}
        />
      </div>

      {/* Contribution grid */}
      <div className="max-w-[860px] mx-auto px-6 md:px-16 mt-2">
        <ContributionGrid dates={postDates} totalPosts={posts.length} totalWords={totalWords} />
      </div>

      {/* Filter + write entry + card grid */}
      <div className="max-w-[860px] mx-auto px-6 md:px-16">
        <PostsGrid posts={posts} allTags={allTags} isOwner={authed} />
      </div>

      {/* Photos + footer */}
      <div className="max-w-[860px] mx-auto px-6 md:px-16">
        <MasonryGallery photos={photos} isOwner={authed} />
        <footer className="pt-6 border-t border-stone-200 flex justify-between items-center">
          <span className="text-[11px] text-stone-400 font-sans">zixuanzhao.com</span>
          <span className="text-[11px] text-stone-400 font-serif italic">带着这些感恩，动身。</span>
        </footer>
      </div>
    </div>
  )
}
