import Link from 'next/link'
import { Post } from '@/lib/supabase'
import { formatDate, getExcerpt } from '@/lib/utils'

interface Props { post: Post; isOwner: boolean }

export default function PostCard({ post }: Props) {
  const bg = post.card_color || '#A8DADC'
  const tc = post.card_text_color || '#1a1a18'

  return (
    <Link
      href={`/p/${post.slug}`}
      style={{ background: bg }}
      className="block p-[18px] min-h-[200px] flex flex-col justify-between hover:opacity-[0.88] transition-opacity duration-150"
    >
      <div style={{ fontFamily: "'Noto Serif SC', Georgia, serif", fontSize: 15, lineHeight: 1.6, fontWeight: 400, color: tc }}>
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
  )
}
