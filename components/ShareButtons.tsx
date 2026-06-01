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

const SERIF = "'Noto Serif SC', Georgia, 'Times New Roman', serif"
const MAX_AREA = 16_000_000
const MAX_DIM = 8192

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
      const card = cardRef.current
      card.style.opacity = '1'
      card.style.width = '1080px'
      card.style.maxHeight = 'none'
      card.style.overflow = 'visible'

      // Wait for fonts used in the actual content
      const sampleText = (title || '') + ' ' + card.innerText.slice(0, 200)
      await Promise.all([
        document.fonts.load(`400 40px 'Noto Serif SC'`, sampleText),
        document.fonts.load(`500 40px 'Noto Serif SC'`, sampleText),
      ]).catch(() => {})
      await document.fonts.ready
      await new Promise(r => setTimeout(r, 200))

      let totalHeight = card.scrollHeight
      if (totalHeight === 0) totalHeight = card.getBoundingClientRect().height
      if (totalHeight === 0) totalHeight = card.offsetHeight
      if (totalHeight === 0) throw new Error('无法获取卡片高度，请重试')

      const width = 1080
      const scale = Math.max(
        0.5,
        Math.min(
          2,
          Math.sqrt(MAX_AREA / (width * totalHeight)),
          MAX_DIM / totalHeight,
          MAX_DIM / width
        )
      )

      console.log('卡片高度:', totalHeight, '缩放比:', scale.toFixed(2))

      const canvas = await html2canvas(card, {
        scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: cardColor,
        width,
        windowWidth: width,
        height: totalHeight,
        scrollX: -card.getBoundingClientRect().left,
        scrollY: 0,
        ignoreElements: el => {
          const src = el.getAttribute?.('src') || ''
          return src.startsWith('http') && !src.includes('supabase')
        },
      })

      card.style.opacity = '0'

      let dataUrl = ''
      try {
        dataUrl = canvas.toDataURL('image/png')
      } catch {
        try {
          dataUrl = canvas.toDataURL('image/jpeg', 0.9)
        } catch {
          throw new Error('无法导出图片，可能有跨域内容')
        }
      }
      if (!dataUrl || dataUrl === 'data:,') throw new Error('内容过长，导出失败，请尝试缩短或分段保存')

      const link = document.createElement('a')
      link.download = `${title || 'zorazhao'}.png`
      link.href = dataUrl
      link.click()
      logShare('image')
    } catch (e) {
      if (cardRef.current) cardRef.current.style.opacity = '0'
      console.error('生成失败:', e)
      alert('生成失败：' + String(e))
    }
    setSaving(false)
  }

  const processedContent = content
    .replace(/<blockquote>/gi, '<div style="border-left:3px solid currentColor;padding-left:20px;opacity:0.7;margin:16px 0;">')
    .replace(/<\/blockquote>/gi, '</div>')
    .replace(/<hr\s*\/?>/gi, '<div style="height:1px;background:currentColor;opacity:0.15;margin:24px 0;"></div>')
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
      {/* 分享卡片：屏幕外渲染，截图时临时设 opacity:1 */}
      <div
        ref={cardRef}
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 0,
          opacity: 0,
          pointerEvents: 'none',
          width: 1080,
          background: cardColor,
          color: cardTextColor,
          padding: '96px 88px 72px',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: SERIF,
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
          <div style={{ fontFamily: SERIF, fontSize: hasImage ? 40 : 56, fontWeight: 400, lineHeight: 1.35, letterSpacing: '-0.01em', marginBottom: 32 }}>
            {title}
          </div>
        )}

        {!hasImage && (
          <div style={{ width: 32, height: 2, background: cardTextColor, opacity: 0.3, marginBottom: 32 }} />
        )}

        <div
          dangerouslySetInnerHTML={{ __html: processedContent }}
          style={{ fontFamily: SERIF, fontSize: 28, lineHeight: 1.85, opacity: 0.82 }}
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
