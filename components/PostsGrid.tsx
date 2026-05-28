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

export default function PostsGrid({ posts, allTags, isOwner }: Props) {
  const [activeTag, setActiveTag] = useState('全部')
  const [fading, setFading] = useState(false)

  const handleTagChange = (tag: string) => {
    setFading(true)
    setTimeout(() => {
      setActiveTag(tag)
      requestAnimationFrame(() => setFading(false))
    }, 80)
  }

  const filtered = activeTag === '全部'
    ? posts
    : posts.filter(p => p.tags?.includes(activeTag))

  return (
    <>
      {/* Filter Bar */}
      <div className="mt-6 mb-2">
        <FilterBar tags={allTags} active={activeTag} onTagChange={handleTagChange} />
      </div>

      {/* Write entry */}
      {isOwner && (
        <a href="/write" className="block group mt-8">
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

      {/* Card grid */}
      <div
        className="mt-8"
        style={{ opacity: fading ? 0.7 : 1, transition: 'opacity 0.15s' }}
      >
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-stone-400 text-sm font-mono">
            {activeTag !== '全部' ? `没有 #${activeTag} 的文章` : '还没有文章，去写第一篇吧。'}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-[2px]">
            {filtered.map(post => (
              <PostCard key={post.id} post={post} isOwner={isOwner} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
