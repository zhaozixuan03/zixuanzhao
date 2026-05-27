'use client'
import { useState } from 'react'
import { Photo } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import { X } from 'lucide-react'

export default function MasonryGallery({ photos }: { photos: Photo[] }) {
  const [selected, setSelected] = useState<Photo | null>(null)

  if (photos.length === 0) return null

  return (
    <section id="photos-section" className="py-12">
      <div className="flex items-baseline justify-between mb-6">
        <span className="text-[10px] tracking-[0.12em] text-stone-400 font-sans">PHOTOS</span>
        <span className="text-[11px] text-stone-400 font-sans">{photos.length} 张</span>
      </div>

      <div className="masonry-grid">
        {photos.map(photo => (
          <div
            key={photo.id}
            className="masonry-item cursor-pointer group relative overflow-hidden rounded-md"
            onClick={() => setSelected(photo)}
          >
            <img
              src={photo.url}
              alt={photo.caption || ''}
              className="w-full block rounded-md transition-opacity group-hover:opacity-90"
              loading="lazy"
            />
            {photo.caption && (
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-end p-3">
                <p className="text-white text-[12px] leading-snug">{photo.caption}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-6 gap-4"
          onClick={() => setSelected(null)}
        >
          <button
            onClick={() => setSelected(null)}
            className="absolute top-5 right-5 text-white/60 hover:text-white"
          >
            <X size={20} />
          </button>
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
