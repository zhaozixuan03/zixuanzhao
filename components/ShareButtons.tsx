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

function getBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob | null> {
  return new Promise(resolve => canvas.toBlob(resolve, type, quality))
}

export default function ShareButtons({ slug, title, content, cardColor, cardTextColor, hasImage, imageUrl, createdAt }: Props) {
  const [copying, setCopying] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const logShare = (share_type: string) =>
    fetch('/api/log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event_type: 'post_shared', payload: { post_id: slug, share_type } }) })

  const copyLink = async () => {
    await navigator.clipboard.writeText(`https://zorazhao.com/p/${slug}​`)
    setCopying(true)
    setTimeout(() => setCopying(false), 1500)
    logShare('link')
  }

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setPreviewBlob(null)
  }

  const handleDownload = () => {
    if (!previewUrl) return
    const a = document.createElement('a')
    a.href = previewUrl
    a.download = `${title || 'zorazhao'}.png`
    a.click()
  }

  const handleShare = async () => {
    if (!previewBlob) return
    const file = new File([previewBlob], `${title || 'zorazhao'}.png`, { type: 'image/png' })
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] })
      }
    } catch (e) {
      console.warn('分享取消或失败:', e)
    }
  }

  const saveImage = async () => {
    if (!cardRef.current) return
    setSaving(true)
    try {
      // Device-aware canvas limits (must be inside function — navigator unavailable during SSR)
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || navigator.maxTouchPoints > 1
      const MAX_DIM  = isMobile ? 4096 : 16384
      const MAX_AREA = isMobile ? 16_777_216 : 268_000_000

      const card = cardRef.current
      card.style.opacity = '1'
      card.style.width = '1080px'
      card.style.maxHeight = 'none'
      card.style.overflow = 'visible'

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
      console.log('高度:', totalHeight, '缩放:', scale.toFixed(2), '设备:', isMobile ? 'mobile' : 'desktop')

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

      let blob = await getBlob(canvas, 'image/png')
      if (!blob) blob = await getBlob(canvas, 'image/jpeg', 0.9)
      if (!blob) throw new Error('内容过长，导出失败，请尝试缩短或分段保存')

      const url = URL.createObjectURL(blob)
      setPreviewBlob(blob)
      setPreviewUrl(url)
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
      {/* 屏幕外卡片，opacity 切换控制可见性 */}
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
          <div style={{ fontFamily: 'Courier New, monospace', fontSize: 22, opacity: 0.4, letterSpacing: '0.06em' }}>zorazhao.com</div>
          <div style={{ fontFamily: 'Courier New, monospace', fontSize: 20, opacity: 0.3 }}>{dateStr}</div>
        </div>
      </div>

      {/* 操作按钮 */}
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

      {/* 预览浮层 */}
      {previewUrl && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) closePreview() }}
        >
          <button
            onClick={closePreview}
            style={{ position: 'absolute', top: 16, right: 20, color: 'white', background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: 4 }}
          >
            ✕
          </button>

          <div style={{ flex: 1, overflowY: 'auto', width: '100%', display: 'flex', justifyContent: 'center', padding: '52px 16px 16px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="分享卡片"
              style={{ maxWidth: '100%', display: 'block', borderRadius: 4 }}
            />
          </div>

          <div style={{ width: '100%', padding: '12px 24px 32px', background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, margin: 0, fontFamily: 'monospace' }}>
              手机可长按图片保存到相册
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={handleDownload}
                style={{ fontSize: 13, fontFamily: 'monospace', color: 'white', background: 'rgba(255,255,255,0.12)', border: '0.5px solid rgba(255,255,255,0.25)', borderRadius: 20, padding: '7px 20px', cursor: 'pointer' }}
              >
                下载
              </button>
              <button
                onClick={handleShare}
                style={{ fontSize: 13, fontFamily: 'monospace', color: 'white', background: 'rgba(255,255,255,0.12)', border: '0.5px solid rgba(255,255,255,0.25)', borderRadius: 20, padding: '7px 20px', cursor: 'pointer' }}
              >
                分享
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
