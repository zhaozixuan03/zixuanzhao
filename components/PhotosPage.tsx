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

async function compressImage(file: File, maxSizeMB = 2): Promise<File> {
  if (file.size < maxSizeMB * 1024 * 1024) return file
  return new Promise(resolve => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ratio = Math.min(1, Math.sqrt((maxSizeMB * 1024 * 1024) / file.size))
      canvas.width = img.width * ratio
      canvas.height = img.height * ratio
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(blob => {
        resolve(new File([blob!], file.name, { type: 'image/jpeg' }))
      }, 'image/jpeg', 0.85)
      URL.revokeObjectURL(url)
    }
    img.src = url
  })
}

export default function PhotosPage({ photos: initial, isOwner }: Props) {
  const router = useRouter()
  const [photos, setPhotos] = useState(initial)
  const [view, setView] = useState<'magazine' | 'grid'>('magazine')
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)

  // Persist view preference so it survives any remount (e.g. after delete triggers re-render)
  useEffect(() => {
    const stored = localStorage.getItem('photosView')
    if (stored === 'grid' || stored === 'magazine') setView(stored)
  }, [])

  const switchView = (v: 'magazine' | 'grid') => {
    localStorage.setItem('photosView', v)
    setView(v)
  }
  const [editing, setEditing] = useState(false)
  const [manageMode, setManageMode] = useState(false)
  const [uploading, setUploading] = useState(false)
  const captionRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const compressed = await compressImage(file)
    const fd = new FormData()
    fd.append('file', compressed)
    const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd })
    const { url } = await uploadRes.json()
    await fetch('/api/photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
    window.location.reload()
  }

  const handleDelete = async (photo: Photo) => {
    await fetch('/api/photos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photo_id: photo.id }),
    })
    setPhotos(prev => prev.filter(p => p.id !== photo.id))
  }

  const toggleManage = () => {
    setManageMode(m => !m)
    setSelectedIdx(null)
  }

  const openPhoto = (idx: number) => {
    if (manageMode) return
    setSelectedIdx(idx)
  }

  const closeLightbox = () => { if (!editing) setSelectedIdx(null) }
  const prev = () => setSelectedIdx(i => i !== null ? Math.max(0, i - 1) : null)
  const next = () => setSelectedIdx(i => i !== null ? Math.min(photos.length - 1, i + 1) : null)

  return (
    <>
      <div style={{ minHeight: '100vh', background: '#f5f4f0' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px' }}>

          {/* Row 1: nav */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '28px 0 16px',
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
                  onClick={() => switchView(v)}
                  style={{
                    background: view === v ? '#1a1a18' : 'transparent',
                    color: view === v ? 'white' : '#999',
                    padding: '4px 14px', fontSize: 11,
                    fontFamily: 'monospace', border: 'none', cursor: 'pointer',
                  }}
                >
                  {v === 'magazine' ? '画廊' : '全览'}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: owner actions */}
          {isOwner && (
            <>
              <div style={{ borderTop: '0.5px solid #ece9e2' }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, padding: '10px 0' }}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  style={{
                    fontSize: 12, fontFamily: 'monospace', color: '#639922',
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    opacity: uploading ? 0.5 : 1,
                  }}
                >
                  {uploading ? '上传中…' : '＋ 上传'}
                </button>
                <button
                  onClick={toggleManage}
                  style={{
                    fontSize: 12, fontFamily: 'monospace',
                    color: manageMode ? '#e05252' : '#999',
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  }}
                >
                  {manageMode ? '完成' : '管理'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleUpload}
                />
              </div>
            </>
          )}

          {/* Divider below header area */}
          <div style={{ borderTop: '0.5px solid #e8e4dc', marginBottom: 32 }} />
        </div>

        {/* Content */}
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px 80px' }}>
          {view === 'magazine' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              {photos.map((photo, idx) => (
                <div
                  key={photo.id}
                  style={{ cursor: manageMode ? 'default' : 'pointer', position: 'relative' }}
                  onClick={() => openPhoto(idx)}
                >
                  <img
                    src={photo.url}
                    alt={photo.caption || ''}
                    style={{ width: '100%', display: 'block', borderRadius: 4 }}
                    loading="lazy"
                  />
                  {manageMode && (
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(photo) }}
                      style={{
                        position: 'absolute', top: 8, right: 8,
                        width: 26, height: 26, borderRadius: '50%',
                        background: '#e05252', color: 'white',
                        border: 'none', cursor: 'pointer',
                        fontSize: 13, lineHeight: 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                      }}
                    >
                      ✕
                    </button>
                  )}
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#aaa' }}>
                      {formatDateFull(photo.created_at)}
                    </div>
                    {photo.caption && (
                      <div style={{ fontFamily: 'Georgia, serif', fontSize: 13, color: '#666', marginTop: 3 }}>
                        {photo.caption}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ columns: 3, columnGap: 4 }}>
              {photos.map((photo, idx) => (
                <div
                  key={photo.id}
                  style={{ breakInside: 'avoid', marginBottom: 4, cursor: manageMode ? 'default' : 'pointer', position: 'relative' }}
                  onClick={() => openPhoto(idx)}
                >
                  <img
                    src={photo.url}
                    alt={photo.caption || ''}
                    style={{ width: '100%', display: 'block', transition: 'opacity 0.2s' }}
                    loading="lazy"
                    onMouseEnter={e => { if (!manageMode) (e.currentTarget as HTMLImageElement).style.opacity = '0.85' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.opacity = '1' }}
                  />
                  {manageMode && (
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(photo) }}
                      style={{
                        position: 'absolute', top: 8, right: 8,
                        width: 26, height: 26, borderRadius: '50%',
                        background: '#e05252', color: 'white',
                        border: 'none', cursor: 'pointer',
                        fontSize: 13, lineHeight: 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                      }}
                    >
                      ✕
                    </button>
                  )}
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
            zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={e => { if (e.target === e.currentTarget) closeLightbox() }}
          onTouchEnd={e => { if (e.target === e.currentTarget) { e.preventDefault(); closeLightbox() } }}
        >
          <button
            onClick={e => { e.stopPropagation(); setSelectedIdx(null) }}
            style={{
              position: 'absolute', top: 16, right: 16,
              color: 'white', background: 'none', border: 'none',
              fontSize: 20, cursor: 'pointer', lineHeight: 1, padding: 4,
            }}
          >
            ✕
          </button>

          {selectedIdx! > 0 && (
            <button
              onClick={e => { e.stopPropagation(); prev() }}
              onTouchEnd={e => { e.stopPropagation(); e.preventDefault(); prev() }}
              style={{
                position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none', cursor: 'pointer',
              }}
            >
              <ChevronLeft size={32} />
            </button>
          )}

          <div
            style={{ display: 'flex', flexDirection: 'column', maxWidth: '85vw', minWidth: 280 }}
            onClick={e => e.stopPropagation()}
            onTouchEnd={e => e.stopPropagation()}
          >
            <img
              src={selected.url}
              alt={selected.caption || ''}
              style={{
                maxWidth: '100%', maxHeight: '70vh',
                objectFit: 'contain', display: 'block',
                borderRadius: '4px 4px 0 0',
              }}
            />
            <div style={{ background: '#111', padding: '12px 16px', borderRadius: '0 0 4px 4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
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
                  <p style={{
                    flex: 1, fontSize: 14, fontFamily: 'Georgia, serif', margin: 0,
                    color: selected.caption ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.22)',
                  }}>
                    {selected.caption || '加点备注…'}
                  </p>
                )}
                {isOwner && (
                  <button
                    onClick={editing ? saveCaption : () => setEditing(true)}
                    style={{
                      fontSize: 13, fontFamily: 'monospace',
                      color: editing ? '#97C459' : '#888',
                      background: 'none', cursor: 'pointer', flexShrink: 0,
                      padding: '6px 14px', borderRadius: 4,
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

          {selectedIdx! < photos.length - 1 && (
            <button
              onClick={e => { e.stopPropagation(); next() }}
              onTouchEnd={e => { e.stopPropagation(); e.preventDefault(); next() }}
              style={{
                position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none', cursor: 'pointer',
              }}
            >
              <ChevronRight size={32} />
            </button>
          )}
        </div>
      )}
    </>
  )
}
