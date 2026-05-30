'use client'
import { useState } from 'react'
import { Post } from '@/lib/supabase'
import PostCard from '@/components/PostCard'
import FilterBar from '@/components/FilterBar'

interface Props {
  posts: Post[]
  allTags: string[]
  isOwner: boolean
}

export default function PostsGrid({ posts: initialPosts, allTags, isOwner }: Props) {
  const [posts, setPosts] = useState(initialPosts)
  const [activeTag, setActiveTag] = useState('全部')
  const [fading, setFading] = useState(false)

  console.log('activeTag:', activeTag)

  const handleTag = (tag: string) => {
    setFading(true)
    setTimeout(() => { setActiveTag(tag); setFading(false) }, 100)
  }

  const filtered = activeTag === '全部'
    ? posts
    : posts.filter((p: Post) => (p.tags || []).includes(activeTag))

  return (
    <div>
      {isOwner && (
        <a href="/write" className="block group mt-10 mb-8">
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

      <div className="mb-4">
        <FilterBar tags={allTags} active={activeTag} onTagChange={handleTag} />
      </div>

      <div
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-[2px] mt-4"
        style={{ opacity: fading ? 0.7 : 1, transition: 'opacity 0.1s' }}
      >
        {filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center text-stone-400 text-sm font-mono">
            {activeTag !== '全部' ? `没有 #${activeTag} 的文章` : '还没有文章，去写第一篇吧。'}
          </div>
        ) : (
          filtered.map(post => (
            <PostCard key={post.id} post={post} isOwner={isOwner} onDelete={id => setPosts(p => p.filter(x => x.id !== id))} />
          ))
        )}
      </div>
    </div>
  )
}
