'use client'
import { useState } from 'react'

interface PostSnippet {
  id: string
  title: string | null
  content_text: string
}

interface Props {
  posts: PostSnippet[]
  dateStr: string
}

export default function HeroQuote({ posts, dateStr }: Props) {
  const valid = posts.filter(p => p.content_text.length > 5)
  const [idx, setIdx] = useState(() =>
    valid.length > 0 ? Math.floor(Math.random() * valid.length) : 0
  )

  const shuffle = () => {
    if (valid.length <= 1) return
    setIdx(i => {
      let next
      do { next = Math.floor(Math.random() * valid.length) } while (next === i)
      return next
    })
  }

  const post = valid[idx] ?? null
  const raw = post?.content_text?.trim() ?? ''
  const excerpt = raw.slice(0, 80)

  return (
    <div className="mb-12">
      {/* Date */}
      <div className="font-mono text-[11px] mb-5" style={{ color: '#bbb' }}>{dateStr}</div>

      {/* Name */}
      <h1
        className="text-[52px] sm:text-[80px]"
        style={{ fontFamily: 'Georgia, serif', fontWeight: 400, lineHeight: 1, letterSpacing: '-0.03em' }}
      >
        <span style={{ color: '#1a1a18' }}>Zixuan </span><span style={{ color: '#27500A' }}>Zhao</span>
      </h1>

      {/* Quote */}
      {post && (
        <div className="mt-6">
          <p className="font-serif text-[15px] sm:text-[17px] leading-[1.75]" style={{ color: '#5a5a55' }}>
            {excerpt}{excerpt.length >= 80 ? '…' : ''}
          </p>
          <div className="mt-2 flex items-center gap-3">
            {post.title && (
              <span className="font-mono text-[10px]" style={{ color: '#ccc' }}>— {post.title}</span>
            )}
            <button
              onClick={shuffle}
              className="font-mono text-[10px] transition-colors hover:text-stone-500"
              style={{ color: '#ccc' }}
            >
              ↻ 换一句
            </button>
          </div>
        </div>
      )}

      {/* Divider + tagline */}
      <div className="mt-6 pt-4 border-t border-stone-100">
        <div className="flex sm:flex-row flex-col sm:justify-between gap-0.5">
          <span className="font-serif text-[16px]" style={{ color: '#aaa' }}>想被看见。</span>
          <span className="font-serif text-[16px]" style={{ color: '#aaa' }}>又怕被看见。</span>
        </div>
      </div>
    </div>
  )
}
