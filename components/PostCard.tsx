import Link from 'next/link'
import { Post } from '@/lib/supabase'
import { formatDate, cardTextColor, getExcerpt } from '@/lib/utils'

interface Props { post: Post; isOwner: boolean }

export default function PostCard({ post }: Props) {
  const bg = post.card_color || '#A8DADC'
  const tc = cardTextColor(bg)

  return (
    <Link
      href={`/p/${post.slug}`}
      style={{ background: bg, color: tc }}
      className="block p-[18px] min-h-[200px] flex flex-col justify-between hover:opacity-[0.88] transition-opacity duration-150"
    >
      <div className="font-mono text-[14px] leading-[1.55]">
        {post.title || getExcerpt(post.content_text, 60)}
      </div>
      <div className="flex justify-between items-end mt-4">
        <span className="font-mono text-[11px] opacity-70">{formatDate(post.created_at)}</span>
        {post.visibility === 'public'
          ? <span className="text-[13px] opacity-60">↗</span>
          : <div style={{ width: 8, height: 8, borderRadius: '50%', border: `1.5px dashed ${tc}`, opacity: 0.5 }} />
        }
      </div>
    </Link>
  )
}
