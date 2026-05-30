'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Post } from '@/lib/supabase'
import { formatDate, getExcerpt } from '@/lib/utils'

interface Props {
  post: Post
  isOwner: boolean
  onDelete?: (id: string) => void
}

export default function PostCard({ post, isOwner, onDelete }: Props) {
  const [deleting, setDeleting] = useState(false)
  const bg = post.card_color || '#A8DADC'
  const tc = post.card_text_color || '#1a1a18'

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('删除这篇？可以在回收站找回。')) return
    setDeleting(true)
    await fetch('/api/posts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: post.id }),
    })
    onDelete?.(post.id)
  }

  return (
    <div className="relative group">
      <Link
        href={`/p/${post.slug}`}
        style={{ background: bg }}
        className="block p-[18px] min-h-[200px] flex flex-col justify-between hover:opacity-[0.88] transition-opacity duration-150"
      >
        <div className="text-[15px] md:text-[17px]" style={{ fontFamily: "'Noto Serif SC', Georgia, serif", lineHeight: 1.6, fontWeight: 400, color: tc }}>
          {post.title || getExcerpt(post.content_text, 60)}
        </div>
        <div className="flex justify-between items-end mt-4">
          <span className="font-mono text-[11px] opacity-70" style={{ color: tc }}>{formatDate(post.created_at)}</span>
          {post.visibility === 'public'
            ? <span className="text-[13px] opacity-60" style={{ color: tc }}>↗</span>
            : <div style={{ width: 8, height: 8, borderRadius: '50%', border: `1.5px dashed ${tc}`, opacity: 0.5 }} />
          }
        </div>
      </Link>
      {isOwner && (
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="absolute top-2 right-2 w-5 h-5 rounded-full bg-black/0 hover:bg-black/20 text-transparent hover:text-white group-hover:opacity-100 opacity-0 transition-all flex items-center justify-center text-[11px] leading-none"
          title="删除"
        >
          ✕
        </button>
      )}
    </div>
  )
}
