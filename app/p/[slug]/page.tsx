import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { isAuthenticated } from '@/lib/auth'
import { formatDateFull } from '@/lib/utils'
import Nav from '@/components/Nav'

export const revalidate = 0

interface Props { params: Promise<{ slug: string }> }

export default async function PostPage({ params }: Props) {
  const { slug } = await params
  const authed = await isAuthenticated()

  const { data: post } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!post) notFound()

  // Visibility check
  if (post.visibility === 'private' && !authed) notFound()

  return (
    <main className="max-w-[620px] mx-auto px-5 pb-20">
      <Nav isAuthed={authed} />

      <article>
        {/* Meta */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[11px] text-stone-400 font-sans">{formatDateFull(post.created_at)}</span>
            {post.visibility === 'quiet' && (
              <span className="text-[10px] px-2 py-0.5 rounded-full border border-stone-200 text-stone-400 font-sans">有链接才能看</span>
            )}
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

      {/* Actions for owner */}
      {authed && (
        <div className="mt-12 pt-6 border-t border-stone-200 flex gap-4">
          <Link href={`/write?edit=${post.id}`} className="text-[12px] text-stone-400 hover:text-[#3B6D11] font-sans transition-colors">
            编辑这篇
          </Link>
        </div>
      )}

      {/* Back */}
      <div className="mt-8">
        <Link href="/" className="text-[12px] text-stone-400 hover:text-stone-700 font-sans transition-colors">
          ← 回首页
        </Link>
      </div>
    </main>
  )
}
