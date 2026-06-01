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
      await document.fonts.ready
      cardRef.current.style.visibility = 'visible'
      cardRef.current.style.position = 'fixed'
      cardRef.current.style.left = '0'
      cardRef.current.style.top = '0'
      cardRef.current.style.zIndex = '-1'
      await new Promise(r => setTimeout(r, 100))
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: cardColor,
        width: 1080,
        windowWidth: 1080,
        logging: false,
      })
      cardRef.current.style.visibility = 'hidden'
      cardRef.current.style.position = 'absolute'
      cardRef.current.style.left = '-9999px'
      cardRef.current.style.zIndex = ''
      const link = document.createElement('a')
      link.download = `${title || 'zorazhao'}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      logShare('image')
    } catch (e) {
      console.error(e)
      if (cardRef.current) {
        cardRef.current.style.visibility = 'hidden'
        cardRef.current.style.position = 'absolute'
        cardRef.current.style.left = '-9999px'
        cardRef.current.style.zIndex = ''
      }
      alert('生成失败，请重试')
    }
    setSaving(false)
  }

  const processedContent = content
    .replace(/<blockquote>/gi, '<div style="border-left:3px solid currentColor;padding-left:20px;opacity:0.7;margin:16px 0;">')
    .replace(/<\/blockquote>/gi, '</div>')
    .replace(/<strong>/gi, '<span style="font-weight:600;">')
    .replace(/<\/strong>/gi, '</span>')
    .replace(/<em>/gi, '<span style="font-style:italic;">')
    .replace(/<\/em>/gi, '</span>')
    .replace(/<h[1-6][^>]*>/gi, '<div style="font-size:1.2em;font-weight:500;margin:16px 0 8px;">')
    .replace(/<\/h[1-6]>/gi, '</div>')
    .replace(/<ul>/gi, '<div style="margin:8px 0;">')
    .replace(/<\/ul>/gi, '</div>')
    .replace(/<li>/gi, '<div style="margin:4px 0;">· ')
    .replace(/<\/li>/gi, '</div>')
    .replace(/<img[^>]+>/gi, '')

  const dateStr = new Date(createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
  const year = new Date(createdAt).getFullYear()

  return (
    <>
      {/* 隐藏分享卡片，html2canvas 截图时临时显示 */}
      <div
        ref={cardRef}
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 0,
          visibility: 'hidden',
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

        <div
          dangerouslySetInnerHTML={{ __html: processedContent }}
          style={{ fontSize: 28, lineHeight: 1.85, opacity: 0.82, fontFamily: 'Georgia, serif', flex: 1 }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 64, paddingTop: 32, borderTop: `1px solid ${cardTextColor}20` }}>
          <div style={{ fontFamily: 'Courier New, monospace', fontSize: 22, opacity: 0.4, letterSpacing: '0.06em' }}>
            zorazhao.com
          </div>
          <div style={{ fontFamily: 'Courier New, monospace', fontSize: 20, opacity: 0.3 }}>
            {dateStr}
          </div>
        </div>
      </div>

      <button
        onClick={copyLink}
        style={{ fontSize: 12, fontFamily: 'monospace', color: '#aaa', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        onMouseEnter={e => (e.currentTarget.style.color = '#555')}
        onMouseLeave={e => (e.currentTarget.style.color = '#aaa')}
      >
        {copying ? '已复制 ✓' : '复制链接'}
      </button>
      <button
        onClick={saveImage}
        style={{ fontSize: 12, fontFamily: 'monospace', color: '#aaa', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        onMouseEnter={e => (e.currentTarget.style.color = '#555')}
        onMouseLeave={e => (e.currentTarget.style.color = '#aaa')}
      >
        {saving ? '生成中…' : '保存为图片'}
      </button>
    </>
  )
}
