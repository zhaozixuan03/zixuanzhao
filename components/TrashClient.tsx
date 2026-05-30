'use client'
import { useState } from 'react'
import { Post, Photo } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'

interface Props {
  initialPosts: Post[]
  initialPhotos: Photo[]
}

const btn = (active: boolean): React.CSSProperties => ({
  background: active ? '#1a1a18' : 'transparent',
  color: active ? 'white' : '#999',
  padding: '4px 14px',
  fontSize: 11,
  fontFamily: 'monospace',
  border: 'none',
  cursor: 'pointer',
})

const actionBtn = (danger?: boolean): React.CSSProperties => ({
  fontSize: 11,
  fontFamily: 'monospace',
  color: danger ? '#e05252' : '#639922',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
})

export default function TrashClient({ initialPosts, initialPhotos }: Props) {
  const [tab, setTab] = useState<'posts' | 'photos'>('posts')
  const [posts, setPosts] = useState(initialPosts)
  const [photos, setPhotos] = useState(initialPhotos)

  const restore = async (id: string, type: 'post' | 'photo') => {
    await fetch('/api/trash', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, type }) })
    if (type === 'post') setPosts(p => p.filter(x => x.id !== id))
    else setPhotos(p => p.filter(x => x.id !== id))
  }

  const purge = async (id: string, type: 'post' | 'photo') => {
    if (!confirm(type === 'post' ? '永久删除这篇文章？无法恢复。' : '永久删除这张照片？无法恢复。')) return
    await fetch('/api/trash', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, type }) })
    if (type === 'post') setPosts(p => p.filter(x => x.id !== id))
    else setPhotos(p => p.filter(x => x.id !== id))
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4f0' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '28px 0 16px', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <a href="/" style={{ fontSize: 12, fontFamily: 'sans-serif', color: '#999', textDecoration: 'none' }}>← 返回</a>
          </div>
          <div style={{ flex: 0 }}>
            <span style={{ fontFamily: "'Noto Serif SC', Georgia, serif", fontSize: 17, fontWeight: 400, color: '#1a1a18', whiteSpace: 'nowrap' }}>回收站</span>
          </div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', border: '0.5px solid #ccc', borderRadius: 20, overflow: 'hidden' }}>
              <button onClick={() => setTab('posts')} style={btn(tab === 'posts')}>
                文字 {posts.length}篇
              </button>
              <button onClick={() => setTab('photos')} style={btn(tab === 'photos')}>
                影像 {photos.length}张
              </button>
            </div>
          </div>
        </div>
        <div style={{ borderTop: '0.5px solid #e8e4dc', marginBottom: 32 }} />
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px 80px' }}>
        {tab === 'posts' ? (
          posts.length === 0 ? (
            <p style={{ fontFamily: 'monospace', fontSize: 13, color: '#ccc' }}>暂无已删除的文章</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {posts.map(post => (
                <div key={post.id} style={{ padding: '16px 0', borderBottom: '0.5px solid #ece9e2' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'Noto Serif SC', Georgia, serif", fontSize: 15, color: '#333', marginBottom: 4 }}>
                        {post.title || <span style={{ color: '#bbb' }}>无标题</span>}
                      </div>
                      {post.content_text && (
                        <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#bbb', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 480 }}>
                          {post.content_text.slice(0, 80)}
                        </div>
                      )}
                      <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#ccc', marginTop: 4 }}>
                        删除于 {post.deleted_at ? formatDate(post.deleted_at) : '—'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 16, flexShrink: 0, marginLeft: 16 }}>
                      <button onClick={() => restore(post.id, 'post')} style={actionBtn()}>恢复</button>
                      <button onClick={() => purge(post.id, 'post')} style={actionBtn(true)}>永久删除</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          photos.length === 0 ? (
            <p style={{ fontFamily: 'monospace', fontSize: 13, color: '#ccc' }}>暂无已删除的照片</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {photos.map(photo => (
                <div key={photo.id} style={{ padding: '12px 0', borderBottom: '0.5px solid #ece9e2', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <img
                    src={photo.url}
                    alt={photo.caption || ''}
                    style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {photo.caption && (
                      <div style={{ fontFamily: "'Noto Serif SC', Georgia, serif", fontSize: 13, color: '#666', marginBottom: 2 }}>
                        {photo.caption}
                      </div>
                    )}
                    <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#ccc' }}>
                      删除于 {photo.deleted_at ? formatDate(photo.deleted_at) : '—'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
                    <button onClick={() => restore(photo.id, 'photo')} style={actionBtn()}>恢复</button>
                    <button onClick={() => purge(photo.id, 'photo')} style={actionBtn(true)}>永久删除</button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}
