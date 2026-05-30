import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { isAuthenticated } from '@/lib/auth'
import { formatDateFull } from '@/lib/utils'
import Nav from '@/components/Nav'
import PublishCelebration from '@/components/PublishCelebration'
import ShareButtons from '@/components/ShareButtons'
import EditHistory from '@/components/EditHistory'
import ViewLogger from '@/components/ViewLogger'

export const revalidate = 0

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ new?: string }>
}

export default async function PostPage({ params, searchParams }: Props) {
  const { slug } = await params
  const sp = await searchParams
  const isNew = sp.new === '1'
  const authed = await isAuthenticated()

  let { data: post } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!post) {
    const decoded = decodeURIComponent(slug)
    if (decoded !== slug) {
      ;({ data: post } = await supabase
        .from('posts')
        .select('*')
        .eq('slug', decoded)
        .single())
    }
  }

  if (!post) notFound()

  // Visibility check
  if (post.visibility === 'private' && !authed) notFound()

  return (
    <>
      <PublishCelebration cardColor={post.card_color} isNew={isNew} />
    <main className="max-w-[860px] mx-auto px-6 md:px-16 pb-20">
      <Nav isAuthed={authed} />

      <article>
        {/* Meta */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[11px] text-stone-400 font-sans">{formatDateFull(post.created_at)}</span>
            {post.visibility === 'private' && (
              <span className="text-[10px] px-2 py-0.5 rounded-full border border-dashed border-stone-300 text-stone-400 font-sans">私密</span>
            )}
          </div>

          {post.title && (
            <h1 className="font-serif text-[24px] font-normal leading-[1.6] text-stone-800 mb-6">
              {post.title}
            </h1>
          )}
        </div>

        {/* Content */}
        <div
          className="post-content"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>

      {authed && <ViewLogger postId={post.id} title={post.title} />}

      {/* Edit history — owner only */}
      {authed && (
        <div className="mt-12">
          <EditHistory createdAt={post.created_at} editHistory={post.edit_history || []} />
        </div>
      )}

      {/* Actions */}
      {(authed || post.visibility === 'public') && (
        <div className="mt-12 pt-6 border-t border-stone-200 flex flex-wrap gap-4 items-center">
          {authed && (
            <Link href={`/write?edit=${post.id}`} className="text-[12px] text-stone-400 hover:text-[#3B6D11] font-sans transition-colors">
              编辑这篇
            </Link>
          )}
          {post.visibility === 'public' && (
            <ShareButtons
              slug={post.slug}
              title={post.title}
              content={post.content}
              cardColor={post.card_color || '#EAF3DE'}
              cardTextColor={post.card_text_color || '#1B3A0A'}
              hasImage={(post.image_urls?.length || 0) > 0}
              imageUrl={post.image_urls?.[0]}
              createdAt={post.created_at}
            />
          )}
        </div>
      )}

      {/* Back */}
      <div className="mt-8">
        <Link href="/" className="text-[12px] text-stone-400 hover:text-stone-700 font-sans transition-colors">
          ← 回首页
        </Link>
      </div>
    </main>
    </>
  )
}
