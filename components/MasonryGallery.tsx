'use client'
import { useState, useEffect, useRef } from 'react'
import { Photo } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

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

export default function MasonryGallery({ photos, isOwner }: Props) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)
  const [managing, setManaging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const touchStartX = useRef(0)

  const selected = selectedIdx !== null ? photos[selectedIdx] : null

  useEffect(() => {
    if (selectedIdx === null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setSelectedIdx(i => i !== null ? Math.max(0, i - 1) : null)
      if (e.key === 'ArrowRight') setSelectedIdx(i => i !== null ? Math.min(photos.length - 1, i + 1) : null)
      if (e.key === 'Escape') setSelectedIdx(null)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedIdx, photos.length])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const compressed = await compressImage(file)
    const fd = new FormData()
    fd.append('file', compressed)
    await fetch('/api/upload', { method: 'POST', body: fd })
    window.location.reload()
  }

  const handleDelete = async (e: React.MouseEvent, photo: Photo) => {
    e.stopPropagation()
    await fetch('/api/upload', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photo_id: photo.id }),
    })
    window.location.reload()
  }

  const prev = () => setSelectedIdx(i => i !== null ? Math.max(0, i - 1) : null)
  const next = () => setSelectedIdx(i => i !== null ? Math.min(photos.length - 1, i + 1) : null)

  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (dx > 50) prev()
    else if (dx < -50) next()
  }

  if (photos.length === 0 && !isOwner) return null

  return (
    <section id="photos-section" className="py-12">
      <div className="flex items-baseline justify-between mb-6">
        <span className="text-[10px] tracking-[0.12em] text-stone-400 font-sans">PHOTOS</span>
        <div className="flex items-center gap-4">
          <span className="text-[11px] text-stone-400 font-sans">{photos.length} 张</span>
          {isOwner && (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-[11px] text-stone-400 hover:text-stone-700 font-sans transition-colors disabled:opacity-50"
              >
                {uploading ? '上传中…' : '+ 上传照片'}
              </button>
              <button
                onClick={() => setManaging(m => !m)}
                className={`text-[11px] font-sans transition-colors ${managing ? 'text-red-400 hover:text-red-600' : 'text-stone-400 hover:text-stone-700'}`}
              >
                {managing ? '完成' : '管理'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
              />
            </>
          )}
        </div>
      </div>

      <div className="masonry-grid">
        {photos.map((photo, idx) => (
          <div
            key={photo.id}
            className="masonry-item cursor-pointer group relative overflow-hidden rounded-md"
            onClick={() => !managing && setSelectedIdx(idx)}
          >
            <img
              src={photo.url}
              alt={photo.caption || ''}
              className="w-full block rounded-md transition-opacity group-hover:opacity-90"
              loading="lazy"
            />
            {photo.caption && !managing && (
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-end p-3">
                <p className="text-white text-[12px] leading-snug">{photo.caption}</p>
              </div>
            )}
            {isOwner && managing && (
              <button
                onClick={e => handleDelete(e, photo)}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 rounded-full text-white text-[11px] flex items-center justify-center z-10"
                title="删除"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-6 gap-4"
          onClick={() => setSelectedIdx(null)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <button
            onClick={e => { e.stopPropagation(); setSelectedIdx(null) }}
            className="absolute top-5 right-5 text-white/60 hover:text-white"
          >
            <X size={20} />
          </button>

          {selectedIdx! > 0 && (
            <button
              onClick={e => { e.stopPropagation(); prev() }}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
            >
              <ChevronLeft size={32} />
            </button>
          )}
          {selectedIdx! < photos.length - 1 && (
            <button
              onClick={e => { e.stopPropagation(); next() }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
            >
              <ChevronRight size={32} />
            </button>
          )}

          <img
            src={selected.url}
            alt={selected.caption || ''}
            className="max-w-full max-h-[75vh] object-contain rounded-lg"
            onClick={e => e.stopPropagation()}
          />
          {selected.caption && (
            <p className="text-white/70 text-[13px] text-center max-w-md font-serif">{selected.caption}</p>
          )}
          <p className="text-white/30 text-[11px] font-sans">{formatDate(selected.created_at)}</p>
        </div>
      )}
    </section>
  )
}
