'use client'
import { useState, useRef } from 'react'
import html2canvas from 'html2canvas'

interface Props {
  slug: string
  title: string | null
  content: string
  cardColor: string
  cardTextColor: string
  hasImage: boolean
  imageUrl?: string
  createdAt: string
}

export default function ShareButtons({ slug, title, content, cardColor, cardTextColor, hasImage, imageUrl, createdAt }: Props) {
  const [copying, setCopying] = useState(false)
  const [saving, setSaving] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const logShare = (share_type: string) =>
    fetch('/api/log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event_type: 'post_shared', payload: { post_id: slug, share_type } }) })

  const copyLink = async () => {
    await navigator.clipboard.writeText(`https://zorazhao.com/p/${slug}​`)
    setCopying(true)
    setTimeout(() => setCopying(false), 1500)
    logShare('link')
  }

  const saveImage = async () => {
    if (!cardRef.current) return
    setSaving(true)
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: cardColor,
        logging: false,
        onclone: (_doc: Document, el: HTMLElement) => {
          el.style.visibility = 'visible'
        },
      })
      const link = document.createElement('a')
      link.download = `${title || slug}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      logShare('image')
    } catch (e) {
      console.error(e)
    }
    setSaving(false)
  }

  const excerpt = content
    .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '$1\n')
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, '$1')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '· $1\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  const dateStr = new Date(createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
  const year = new Date(createdAt).getFullYear()

  return (
    <div>
      {/* 隐藏分享卡片，用于 html2canvas 截图 */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0, visibility: 'hidden' }}>
        <div
          ref={cardRef}
          data-share-card
          style={{
            width: 1080,
            background: cardColor,
            color: cardTextColor,
            padding: '96px 88px 72px',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'Georgia, serif',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ fontFamily: 'Courier New, monospace', fontSize: 22, opacity: 0.5, letterSpacing: '0.14em', marginBottom: 56 }}>
            ZIXUAN ZHAO · {year}
          </div>

          {hasImage && imageUrl && (
            <img
              src={imageUrl}
              crossOrigin="anonymous"
              alt=""
              style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 8, marginBottom: 48 }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
            />
          )}

          {title && (
            <div style={{ fontSize: hasImage ? 40 : 56, fontWeight: 400, lineHeight: 1.35, letterSpacing: '-0.01em', marginBottom: 32 }}>
              {title}
            </div>
          )}

          {!hasImage && (
            <div style={{ width: 32, height: 2, background: cardTextColor, opacity: 0.3, marginBottom: 32 }} />
          )}

          <div style={{ fontSize: hasImage ? 26 : 28, lineHeight: 1.85, opacity: 0.8, flex: 1, whiteSpace: 'pre-line' }}>
            {excerpt}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 64, paddingTop: 32, borderTop: `1px solid ${cardTextColor}20` }}>
            <div style={{ fontFamily: 'Courier New, monospace', fontSize: 22, opacity: 0.4, letterSpacing: '0.06em' }}>
              zorazhao.com
            </div>
            <div style={{ fontFamily: 'Courier New, monospace', fontSize: 20, opacity: 0.3 }}>
              {dateStr}
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={copyLink}
        style={{ fontSize: 11, fontFamily: 'monospace', color: '#aaa', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        onMouseEnter={e => (e.currentTarget.style.color = '#555')}
        onMouseLeave={e => (e.currentTarget.style.color = '#aaa')}
      >
        {copying ? '已复制 ✓' : '复制链接'}
      </button>
      <span style={{ color: '#ddd', fontSize: 11, margin: '0 8px' }}>·</span>
      <button
        onClick={saveImage}
        style={{ fontSize: 11, fontFamily: 'monospace', color: '#aaa', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        onMouseEnter={e => (e.currentTarget.style.color = '#555')}
        onMouseLeave={e => (e.currentTarget.style.color = '#aaa')}
      >
        {saving ? '生成中…' : '保存为图片'}
      </button>
    </div>
  )
}
