'use client'

import { useState } from 'react'

interface Props {
  slug: string
  title: string | null
}

const btnStyle: React.CSSProperties = {
  fontSize: 12,
  fontFamily: 'monospace',
  border: '0.5px solid #d6d3cd',
  borderRadius: 20,
  padding: '6px 14px',
  color: '#a8a29e',
  background: 'none',
  cursor: 'pointer',
}

export default function ShareButtons({ slug, title }: Props) {
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)

  const copyLink = async () => {
    await navigator.clipboard.writeText(`https://zorazhao.com/p/${slug}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const downloadImage = async () => {
    setGenerating(true)
    try {
      const res = await fetch(`/api/share?slug=${encodeURIComponent(slug)}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${title || slug}.png`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <button onClick={copyLink} style={btnStyle}>
        {copied ? '已复制 ✓' : '复制链接'}
      </button>
      <button
        onClick={downloadImage}
        disabled={generating}
        style={{ ...btnStyle, opacity: generating ? 0.5 : 1, cursor: generating ? 'default' : 'pointer' }}
      >
        {generating ? '生成中…' : '保存为图片'}
      </button>
    </div>
  )
}
