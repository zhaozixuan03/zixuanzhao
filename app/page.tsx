import { supabase } from '@/lib/supabase'
import { isAuthenticated } from '@/lib/auth'
import { countWords } from '@/lib/utils'
import ContributionGrid from '@/components/ContributionGrid'
import PostCard from '@/components/PostCard'
import MasonryGallery from '@/components/MasonryGallery'
import Nav from '@/components/Nav'
import FilterBar from '@/components/FilterBar'
import HeroQuote from '@/components/HeroQuote'

export const revalidate = 0

async function getData(authed: boolean) {
  const visFilter = authed ? ['public', 'private'] : ['public']
  const [postsRes, photosRes] = await Promise.all([
    supabase.from('posts').select('*').in('visibility', visFilter).order('created_at', { ascending: false }),
    supabase.from('photos').select('*').is('post_id', null).order('created_at', { ascending: false }),
  ])
  return { posts: postsRes.data || [], photos: photosRes.data || [] }
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>
}) {
  const sp = await searchParams
  const currentTag = sp.tag

  const authed = await isAuthenticated()
  const { posts, photos } = await getData(authed)
  const now = new Date()
  const dateStr = `${now.getFullYear()} · ${String(now.getMonth() + 1).padStart(2, '0')} · ${String(now.getDate()).padStart(2, '0')}`
  const postDates = posts.map((p: any) => p.created_at)
  const totalWords = posts.reduce((sum: number, p: any) => sum + countWords(p.content_text || ''), 0)

  const allTags: string[] = [...new Set(posts.flatMap((p: any) => p.tags || []))].sort() as string[]
  const filteredPosts = currentTag
    ? posts.filter((p: any) => (p.tags || []).includes(currentTag))
    : posts

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

      {/* Filter Bar */}
      <div className="max-w-[860px] mx-auto px-6 md:px-16 mt-6 mb-2">
        <FilterBar tags={allTags} active={currentTag} />
      </div>

      {/* Write entry */}
      {authed && (
        <div className="max-w-[860px] mx-auto px-6 md:px-16">
          <a href="/write" className="block group mt-10">
            <div className="border border-dashed border-stone-300 hover:border-[#97C459] rounded-2xl px-8 py-8 transition-all duration-300 hover:bg-[#f0f5e8] cursor-text">
              <div className="font-serif text-[22px] text-stone-300 group-hover:text-[#97C459] transition-colors duration-300 leading-relaxed">
                今天想写点什么？
              </div>
              <div className="mt-3 text-[12px] text-stone-300 group-hover:text-[#b5cc8e] font-sans transition-colors duration-300">
                点击开始写 · 支持文字和图片
              </div>
            </div>
          </a>
        </div>
      )}

      {/* Card grid — edge-to-edge within container */}
      <div className="max-w-[860px] mx-auto px-6 md:px-16 mt-10">
        {filteredPosts.length === 0 ? (
          <div className="py-16 text-center text-stone-400 text-sm font-mono">
            {currentTag ? `没有 #${currentTag} 的文章` : '还没有文章，去写第一篇吧。'}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-[2px]">
            {filteredPosts.map((post: any) => (
              <PostCard key={post.id} post={post} isOwner={authed} />
            ))}
          </div>
        )}
      </div>

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
