import Link from 'next/link'
import { Post } from '@/lib/supabase'
import { formatDate, getExcerpt } from '@/lib/utils'

interface Props {
  post: Post
  isOwner: boolean
}

const VIS_DOT: Record<Post['visibility'], string> = {
  public: 'bg-[#97C459]',
  private: 'border border-dashed border-stone-300 bg-transparent',
}

const VIS_LABEL: Record<Post['visibility'], string> = {
  public: '公开',
  private: '只有自己',
}

export default function PostCard({ post, isOwner }: Props) {
  const excerpt = getExcerpt(post.content_text)
  const isPrivate = post.visibility === 'private'

  return (
    <Link href={`/p/${post.slug}`} className="group block py-6 border-b border-stone-200 last:border-none">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          {post.title && (
            <h2 className="text-[17px] text-stone-800 leading-snug mb-1.5 group-hover:text-[#3B6D11] transition-colors font-serif font-normal">
              {post.title}
            </h2>
          )}

          {!isPrivate && (
            <p className="text-[13px] text-stone-500 leading-relaxed font-sans line-clamp-2">{excerpt}</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0 mt-0.5">
          <span className="text-[11px] text-stone-400 font-sans">{formatDate(post.created_at)}</span>
          <div className={`w-[6px] h-[6px] rounded-full ${VIS_DOT[post.visibility]}`} title={VIS_LABEL[post.visibility]} />
        </div>
      </div>
    </Link>
  )
}
