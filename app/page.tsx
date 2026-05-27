import { supabase } from '@/lib/supabase'
import { isAuthenticated } from '@/lib/auth'
import { countWords } from '@/lib/utils'
import Nav from '@/components/Nav'
import ContributionGrid from '@/components/ContributionGrid'
import PostCard from '@/components/PostCard'
import MasonryGallery from '@/components/MasonryGallery'

export const revalidate = 0

async function getData(authed: boolean) {
  const visFilter = authed ? ['public', 'private'] : ['public']
  const [postsRes, photosRes] = await Promise.all([
    supabase.from('posts').select('*').in('visibility', visFilter).order('created_at', { ascending: false }),
    supabase.from('photos').select('*').order('created_at', { ascending: false }),
  ])
  return { posts: postsRes.data || [], photos: photosRes.data || [] }
}

export default async function Home() {
  const authed = await isAuthenticated()
  const { posts, photos } = await getData(authed)
  const postDates = posts.map((p: any) => p.created_at)
  const totalWords = posts.reduce((sum: number, p: any) => sum + countWords(p.content_text || ''), 0)

  return (
    <main className="max-w-[860px] mx-auto px-6 md:px-16 pb-20">
      <Nav isAuthed={authed} />

      <div className="pb-10 border-b border-stone-200">
        <h1 className="font-serif text-[42px] md:text-[64px] font-normal leading-[1.3] text-stone-800 mb-3">
          有时候，真正的抵达，<br />
          藏在出发之<span className="text-[#639922]">前</span>。
        </h1>
        <p className="text-[14px] text-stone-400 mt-4 font-sans">这里是我放字的地方。方方面面，随时随地。</p>
      </div>

      <ContributionGrid dates={postDates} totalPosts={posts.length} totalWords={totalWords} />

      {authed && (
        <a href="/write" className="block group my-10">
          <div className="border border-dashed border-stone-300 hover:border-[#97C459] rounded-2xl px-8 py-8 transition-all duration-300 hover:bg-[#f0f5e8] cursor-text">
            <div className="font-serif text-[22px] text-stone-300 group-hover:text-[#97C459] transition-colors duration-300 leading-relaxed">
              今天想写点什么？
            </div>
            <div className="mt-3 text-[12px] text-stone-300 group-hover:text-[#b5cc8e] font-sans transition-colors duration-300">
              点击开始写 · 支持文字和图片
            </div>
          </div>
        </a>
      )}

      <section className="py-10">
        <div className="text-[10px] tracking-[0.12em] text-stone-400 font-sans mb-6">RECENT</div>
        {posts.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-stone-400 text-[14px] font-serif">还没有文字，去写第一篇吧。</p>
            {authed && <a href="/write" className="mt-4 inline-block text-[13px] text-[#3B6D11] font-sans">开始写 →</a>}
          </div>
        ) : (
          posts.map((post: any) => <PostCard key={post.id} post={post} isOwner={authed} />)
        )}
      </section>

      <MasonryGallery photos={photos} isOwner={authed} />

      <footer className="pt-6 border-t border-stone-200 flex justify-between items-center">
        <span className="text-[11px] text-stone-400 font-sans">zixuanzhao.com</span>
        <span className="text-[11px] text-stone-400 font-serif italic">带着这些感恩，动身。</span>
      </footer>
    </main>
  )
}
