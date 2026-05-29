'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Photo } from '@/lib/supabase'
import { formatDateFull } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  photos: Photo[]
  isOwner: boolean
}

export default function PhotosPage({ photos: initial, isOwner }: Props) {
  const router = useRouter()
  const [photos, setPhotos] = useState(initial)
  const [view, setView] = useState<'magazine' | 'grid'>('magazine')
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [editing, setEditing] = useState(false)
  const captionRef = useRef<HTMLDivElement>(null)

  const selected = selectedIdx !== null ? photos[selectedIdx] : null

  useEffect(() => {
    if (selectedIdx === null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editing) { setEditing(false); return }
        setSelectedIdx(null)
        return
      }
      if (editing) return
      if (e.key === 'ArrowLeft') setSelectedIdx(i => i !== null ? Math.max(0, i - 1) : null)
      if (e.key === 'ArrowRight') setSelectedIdx(i => i !== null ? Math.min(photos.length - 1, i + 1) : null)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedIdx, photos.length, editing])

  useEffect(() => { setEditing(false) }, [selectedIdx])

  useEffect(() => {
    if (editing && captionRef.current && selectedIdx !== null) {
      captionRef.current.textContent = photos[selectedIdx]?.caption || ''
      captionRef.current.focus()
      const range = document.createRange()
      const sel = window.getSelection()
      range.selectNodeContents(captionRef.current)
      range.collapse(false)
      sel?.removeAllRanges()
      sel?.addRange(range)
    }
  }, [editing])

  const saveCaption = async () => {
    if (selectedIdx === null || !captionRef.current) return
    const text = captionRef.current.textContent || ''
    await fetch('/api/photos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photo_id: photos[selectedIdx].id, caption: text }),
    })
    setPhotos(prev => prev.map((p, i) => i === selectedIdx ? { ...p, caption: text } : p))
    setEditing(false)
  }

  const prev = () => setSelectedIdx(i => i !== null ? Math.max(0, i - 1) : null)
  const next = () => setSelectedIdx(i => i !== null ? Math.min(photos.length - 1, i + 1) : null)

  return (
    <>
      <div style={{ minHeight: '100vh', background: '#f5f4f0' }}>
        {/* Header */}
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '28px 0 20px', borderBottom: '1px solid #e8e4dc',
          }}>
            <button
              onClick={() => router.push('/')}
              style={{ fontSize: 12, fontFamily: 'sans-serif', color: '#999', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
            >
              ← 返回
            </button>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: 16, color: '#333' }}>影像</span>
            <div style={{ display: 'flex', border: '0.5px solid #ccc', borderRadius: 20, overflow: 'hidden' }}>
              {(['magazine', 'grid'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  style={{
                    background: view === v ? '#1a1a18' : 'transparent',
                    color: view === v ? 'white' : '#999',
                    padding: '4px 14px',
                    fontSize: 11,
                    fontFamily: 'monospace',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {v === 'magazine' ? '杂志流' : '网格'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px 80px' }}>
          {view === 'magazine' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
              {photos.map((photo, idx) => (
                <div key={photo.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedIdx(idx)}>
                  <img
                    src={photo.url}
                    alt={photo.caption || ''}
                    style={{ width: '100%', display: 'block', borderRadius: 6 }}
                    loading="lazy"
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 10, gap: 16 }}>
                    <p style={{ fontFamily: 'Georgia, serif', fontSize: 14, color: '#555', margin: 0 }}>
                      {photo.caption || ''}
                    </p>
                    <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#bbb', flexShrink: 0 }}>
                      {formatDateFull(photo.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
              {photos.map((photo, idx) => (
                <div
                  key={photo.id}
                  style={{ aspectRatio: '1', overflow: 'hidden', cursor: 'pointer' }}
                  onClick={() => setSelectedIdx(idx)}
                >
                  <img
                    src={photo.url}
                    alt={photo.caption || ''}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'opacity 0.2s' }}
                    loading="lazy"
                    onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.85' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.opacity = '1' }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {selected && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.93)',
            zIndex: 50, display: 'flex', flexDirection: 'column',
          }}
          onClick={() => { if (!editing) setSelectedIdx(null) }}
        >
          {/* Image area */}
          <div
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', padding: '24px 72px', overflow: 'hidden',
            }}
            onClick={e => e.stopPropagation()}
          >
            {selectedIdx! > 0 && (
              <button
                onClick={prev}
                style={{
                  position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                  color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none', cursor: 'pointer',
                }}
              >
                <ChevronLeft size={32} />
              </button>
            )}

            <img
              src={selected.url}
              alt={selected.caption || ''}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 4 }}
            />

            {selectedIdx! < photos.length - 1 && (
              <button
                onClick={next}
                style={{
                  position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                  color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none', cursor: 'pointer',
                }}
              >
                <ChevronRight size={32} />
              </button>
            )}
          </div>

          {/* Info bar */}
          <div
            style={{ background: '#111', padding: '16px 24px', flexShrink: 0 }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              {editing ? (
                <div
                  ref={captionRef}
                  contentEditable
                  suppressContentEditableWarning
                  onKeyDown={e => {
                    e.stopPropagation()
                    if (e.key === 'Enter') { e.preventDefault(); saveCaption() }
                  }}
                  style={{
                    flex: 1, color: 'white', fontSize: 14, outline: 'none', minHeight: 22,
                    fontFamily: 'Georgia, serif',
                    borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: 2,
                  }}
                />
              ) : (
                <p style={{ flex: 1, color: 'rgba(255,255,255,0.65)', fontSize: 14, fontFamily: 'Georgia, serif', margin: 0 }}>
                  {selected.caption || '暂无备注'}
                </p>
              )}
              {isOwner && (
                <button
                  onClick={editing ? saveCaption : () => setEditing(true)}
                  style={{
                    fontSize: 11, fontFamily: 'monospace',
                    color: editing ? '#97C459' : '#888',
                    background: 'none', cursor: 'pointer', flexShrink: 0,
                    padding: '3px 10px', borderRadius: 4,
                    border: `0.5px solid ${editing ? '#639922' : '#444'}`,
                  }}
                >
                  {editing ? '保存' : '编辑备注'}
                </button>
              )}
            </div>
            <p style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: 0 }}>
              {formatDateFull(selected.created_at)}
            </p>
          </div>
        </div>
      )}
    </>
  )
}
