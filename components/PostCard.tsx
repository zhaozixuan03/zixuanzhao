import Link from 'next/link'
import { Post } from '@/lib/supabase'
import { formatDate, getExcerpt } from '@/lib/utils'

interface Props {
  post: Post
  isOwner: boolean
}

const VIS_DOT: Record<Post['visibility'], string> = {
  public: 'bg-[#97C459]',
  quiet: 'border border-stone-300 bg-transparent',
  private: 'border border-dashed border-stone-300 bg-transparent',
}

const VIS_LABEL: Record<Post['visibility'], string> = {
  public: '公开',
  quiet: '有链接才能看',
  private: '只有自己',
}

export default function PostCard({ post, isOwner }: Props) {
  const excerpt = getExcerpt(post.content_text)
  const firstImage = post.image_urls?.[0]
  const isPrivate = post.visibility === 'private'

  return (
    <Link href={`/p/${post.slug}`} className="group block py-5 border-b border-stone-200 last:border-none">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          {/* Title */}
          {post.title && (
            <h2 className="text-[15px] text-stone-800 leading-snug mb-1.5 group-hover:text-[#3B6D11] transition-colors font-serif font-normal">
              {post.title}
            </h2>
          )}

          {/* Excerpt or private indicator */}
          {isPrivate && !isOwner ? null : isPrivate ? (
            <p className="text-[13px] text-stone-400 italic font-sans">私密 · 只有你能看到这篇</p>
          ) : (
            <p className="text-[13px] text-stone-500 leading-relaxed font-sans line-clamp-2">{excerpt}</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0 mt-0.5">
          <span className="text-[11px] text-stone-400 font-sans">{formatDate(post.created_at)}</span>
          <div className="flex items-center gap-1.5">
            <div className={`w-[6px] h-[6px] rounded-full ${VIS_DOT[post.visibility]}`} title={VIS_LABEL[post.visibility]} />
          </div>
          {/* Thumbnail on the right */}
          {firstImage && !isPrivate && (
            <img
              src={firstImage}
              alt=""
              className="w-20 h-20 object-cover rounded"
            />
          )}
        </div>
      </div>
    </Link>
  )
}
