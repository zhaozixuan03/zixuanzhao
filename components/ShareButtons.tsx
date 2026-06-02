'use client'
import { useState } from 'react'

interface Props {
  slug: string
  title: string | null
}

export default function ShareButtons({ slug, title }: Props) {
  const [copying, setCopying] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null)

  const logShare = (share_type: string) =>
    fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: 'post_shared', payload: { post_id: slug, share_type } }),
    })

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
    setSaving(true)
    try {
      const res = await fetch(`/api/card/${encodeURIComponent(slug)}`)
      if (!res.ok) throw new Error(`服务端错误 ${res.status}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setPreviewBlob(blob)
      setPreviewUrl(url)
      logShare('image')
    } catch (e) {
      console.error('生成失败:', e)
      alert('生成失败：' + String(e))
    }
    setSaving(false)
  }

  return (
    <>
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
            <img src={previewUrl} alt="分享卡片" style={{ maxWidth: '100%', display: 'block', borderRadius: 4 }} />
          </div>
          <div style={{ width: '100%', padding: '12px 24px 32px', background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, margin: 0, fontFamily: 'monospace' }}>
              手机可长按图片保存到相册
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={handleDownload} style={{ fontSize: 13, fontFamily: 'monospace', color: 'white', background: 'rgba(255,255,255,0.12)', border: '0.5px solid rgba(255,255,255,0.25)', borderRadius: 20, padding: '7px 20px', cursor: 'pointer' }}>
                下载
              </button>
              <button onClick={handleShare} style={{ fontSize: 13, fontFamily: 'monospace', color: 'white', background: 'rgba(255,255,255,0.12)', border: '0.5px solid rgba(255,255,255,0.25)', borderRadius: 20, padding: '7px 20px', cursor: 'pointer' }}>
                分享
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
