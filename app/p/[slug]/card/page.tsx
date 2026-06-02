import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ShareCard from '@/components/ShareCard'

export const revalidate = 0

interface Props {
  params: Promise<{ slug: string }>
}

export default async function CardPage({ params }: Props) {
  const { slug } = await params

  const { data: post } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!post || post.visibility === 'private') notFound()

  return (
    <div style={{ background: post.card_color || '#EAF3DE', minHeight: '100vh' }}>
      <ShareCard
        title={post.title}
        content={post.content}
        cardColor={post.card_color || '#EAF3DE'}
        cardTextColor={post.card_text_color || '#1B3A0A'}
        hasImage={(post.image_urls?.length || 0) > 0}
        imageUrl={post.image_urls?.[0]}
        createdAt={post.created_at}
      />
    </div>
  )
}
