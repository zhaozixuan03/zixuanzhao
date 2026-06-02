'use client'
import { useState, useRef } from 'react'
import html2canvas from 'html2canvas'
import ShareCard from '@/components/ShareCard'

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

function getBlob(c: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise(r => c.toBlob(r, 'image/png'))
}

export default function ShareButtons({ slug, title, content, cardColor, cardTextColor, hasImage, imageUrl, createdAt }: Props) {
  const [copying, setCopying] = useState(false)
  const [saving, setSaving] = useState(false)
  const [tiles, setTiles] = useState<{ url: string; blob: Blob }[]>([])
  const cardRef = useRef<HTMLDivElement>(null)

  const logShare = (share_type: string) =>
    fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: 'post_shared', payload: { post_id: slug, share_type } }),
    })

  const copyLink = async () => {
    await navigator.clipboard.writeText(`https://zorazhao.com/p/${slug}`)
    setCopying(true)
    setTimeout(() => setCopying(false), 1500)
    logShare('link')
  }

  const closePreview = () => {
    tiles.forEach(t => URL.revokeObjectURL(t.url))
    setTiles([])
  }

  const saveImage = async () => {
    const card = cardRef.current
    if (!card) return
    setSaving(true)
    try {
      const sample = (title || '') + ' ' + card.innerText.slice(0, 200)
      await Promise.all([
        document.fonts.load(`400 40px 'Noto Serif SC'`, sample),
        document.fonts.load(`500 40px 'Noto Serif SC'`, sample),
      ]).catch(() => {})
      await document.fonts.ready
      await new Promise(r => setTimeout(r, 200))

      const width = 1080
      const totalHeight = card.scrollHeight || card.getBoundingClientRect().height || card.offsetHeight
      if (!totalHeight) throw new Error('无法获取卡片高度，请重试')

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || navigator.maxTouchPoints > 1
      const MAX_DIM = isMobile ? 4096 : 16384
      const scale = isMobile ? 2 : 3

      const tileCssH = Math.floor(MAX_DIM / scale)
      const count = Math.max(1, Math.ceil(totalHeight / tileCssH))

      const out: { url: string; blob: Blob }[] = []
      for (let i = 0; i < count; i++) {
        const y = i * tileCssH
        const h = Math.min(tileCssH, totalHeight - y)
        const canvas = await html2canvas(card, {
          scale,
          useCORS: true,
          allowTaint: true,
          backgroundColor: cardColor,
          width,
          windowWidth: width,
          windowHeight: totalHeight,
          height: h,
          y,
          scrollX: -card.getBoundingClientRect().left,
          scrollY: 0,
          ignoreElements: el => {
            const src = el.getAttribute?.('src') || ''
            return src.startsWith('http') && !src.includes('supabase')
          },
        })
        const blob = await getBlob(canvas)
        if (!blob) throw new Error('导出失败，请重试')
        out.push({ url: URL.createObjectURL(blob), blob })
      }
      setTiles(out)
      logShare('image')
    } catch (e) {
      console.error('生成失败:', e)
      alert('生成失败：' + String(e))
    }
    setSaving(false)
  }

  const downloadTile = (t: { url: string; blob: Blob }, i: number) => {
    const a = document.createElement('a')
    a.href = t.url
    a.download = `${title || 'zorazhao'}${tiles.length > 1 ? `_${i + 1}` : ''}.png`
    a.click()
  }

  const shareTiles = async () => {
    try {
      const files = tiles.map((t, i) =>
        new File([t.blob], `${title || 'zorazhao'}_${i + 1}.png`, { type: 'image/png' })
      )
      if (navigator.canShare?.({ files })) await navigator.share({ files })
    } catch (e) {
      console.warn('分享取消或失败:', e)
    }
  }

  const btn: React.CSSProperties = {
    fontSize: 12, fontFamily: 'monospace', color: '#aaa',
    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
  }

  return (
    <>
      {/* 屏幕外卡片，html2canvas 截图目标 */}
      <div
        ref={cardRef}
        style={{ position: 'absolute', left: -9999, top: 0, width: 1080, pointerEvents: 'none' }}
      >
        <ShareCard
          title={title}
          content={content}
          cardColor={cardColor}
          cardTextColor={cardTextColor}
          hasImage={hasImage}
          imageUrl={imageUrl}
          createdAt={createdAt}
        />
      </div>

      <button
        onClick={copyLink}
        style={btn}
        onMouseEnter={e => (e.currentTarget.style.color = '#555')}
        onMouseLeave={e => (e.currentTarget.style.color = '#aaa')}
      >
        {copying ? '已复制 ✓' : '复制链接'}
      </button>
      <button
        onClick={saveImage}
        style={btn}
        onMouseEnter={e => (e.currentTarget.style.color = '#555')}
        onMouseLeave={e => (e.currentTarget.style.color = '#aaa')}
      >
        {saving ? '生成中…' : '保存为图片'}
      </button>

      {/* 预览浮层 */}
      {tiles.length > 0 && (
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

          <div style={{ flex: 1, overflowY: 'auto', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '52px 16px 16px' }}>
            {tiles.map((t, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={t.url} alt={`分享卡片 ${i + 1}`} style={{ maxWidth: '100%', display: 'block', borderRadius: 4 }} />
            ))}
          </div>

          <div style={{ width: '100%', padding: '12px 24px 32px', background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, margin: 0, fontFamily: 'monospace' }}>
              {tiles.length > 1 ? `长文已分为 ${tiles.length} 张，可逐张长按保存` : '手机可长按图片保存到相册'}
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => tiles.forEach(downloadTile)}
                style={{ fontSize: 13, fontFamily: 'monospace', color: 'white', background: 'rgba(255,255,255,0.12)', border: '0.5px solid rgba(255,255,255,0.25)', borderRadius: 20, padding: '7px 20px', cursor: 'pointer' }}
              >
                下载{tiles.length > 1 ? '全部' : ''}
              </button>
              <button
                onClick={shareTiles}
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
