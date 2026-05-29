'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Photo } from '@/lib/supabase'

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

const STACK_OFFSETS = [
  { rotate: '0deg',  x: 0,   y: 0  },
  { rotate: '-5deg', x: -10, y: 6  },
  { rotate: '4deg',  x: 12,  y: 8  },
  { rotate: '-3deg', x: -6,  y: 10 },
]

export default function MasonryGallery({ photos, isOwner }: Props) {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  if (photos.length === 0 && !isOwner) return null

  const visible = Math.min(4, photos.length)
  const visiblePhotos = photos.slice(0, visible)

  return (
    <section id="photos-section" className="py-12">
      {/* Header — always on top, position:relative + z-index keeps it above the stack */}
      <div className="flex items-baseline justify-between mb-6" style={{ position: 'relative', zIndex: 2 }}>
        <span className="text-[10px] tracking-[0.12em] text-stone-400 font-sans">PHOTOS</span>
        {isOwner && (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-[11px] text-stone-400 hover:text-stone-700 font-sans transition-colors disabled:opacity-50"
            >
              {uploading ? '上传中…' : '+ 上传照片'}
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

      {photos.length > 0 ? (
        <div
          style={{ cursor: 'pointer', position: 'relative', zIndex: 1 }}
          onClick={() => router.push('/photos')}
        >
          <div style={{ position: 'relative', aspectRatio: '3/2', isolation: 'isolate' }}>
            {visiblePhotos.map((photo, idx) => {
              const off = STACK_OFFSETS[idx]
              return (
                <div
                  key={photo.id}
                  style={{
                    position: 'absolute', inset: 0,
                    transform: `rotate(${off.rotate}) translate(${off.x}px, ${off.y}px)`,
                    zIndex: visible - idx,
                    borderRadius: 8,
                    overflow: 'hidden',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
                  }}
                >
                  <img
                    src={photo.url}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    loading="lazy"
                  />
                </div>
              )
            })}

            <div style={{
              position: 'absolute', top: -8, right: -8, zIndex: 10,
              width: 30, height: 30, borderRadius: '50%',
              background: '#3B6D11', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontFamily: 'monospace', fontWeight: 600,
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            }}>
              {photos.length}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-[12px] text-stone-400 font-sans">还没有照片，点上方上传第一张。</p>
      )}
    </section>
  )
}
