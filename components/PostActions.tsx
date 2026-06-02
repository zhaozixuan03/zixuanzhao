'use client'
import DeletePostButton from '@/components/DeletePostButton'
import ShareButtons from '@/components/ShareButtons'

interface Props {
  postId: string
  slug: string
  title: string | null
  visibility: string
  isOwner: boolean
}

export default function PostActions({ postId, slug, title, visibility, isOwner }: Props) {
  const showActions = isOwner || visibility === 'public'
  if (!showActions) return null

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 20, paddingBottom: 16, borderBottom: '0.5px solid #e8e6e0' }}>
      {isOwner && (
        <>
          <a
            href={`/write?edit=${postId}`}
            style={{ fontSize: 12, color: '#aaa', fontFamily: 'monospace', textDecoration: 'none' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#3B6D11')}
            onMouseLeave={e => (e.currentTarget.style.color = '#aaa')}
          >
            编辑这篇
          </a>
          <DeletePostButton postId={postId} compact />
        </>
      )}
      {visibility === 'public' && (
        <ShareButtons slug={slug} title={title} />
      )}
    </div>
  )
}
