export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import React from 'react'

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return lastSpace > max - 20 ? cut.slice(0, lastSpace) + '…' : cut + '…'
}

async function loadFont(text: string) {
  const chars = [...new Set(text.split(''))].join('') || 'ZORAZHAO'
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400&text=${encodeURIComponent(chars)}`,
    {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    }
  ).then(r => r.text())

  const urls = [...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com[^)]+)\)/g)].map(m => m[1])
  if (urls.length === 0) throw new Error('No font URLs found in Google Fonts CSS')

  const buffers = await Promise.all(urls.map(u => fetch(u).then(r => r.arrayBuffer())))
  return buffers.map(data => ({
    name: 'Noto Serif SC',
    data,
    weight: 400 as const,
    style: 'normal' as const,
  }))
}

function fmtYear(d: string) {
  return new Date(d).getFullYear().toString()
}

function fmtDate(d: string) {
  const dt = new Date(d)
  return `${dt.getFullYear()}.${String(dt.getMonth() + 1).padStart(2, '0')}.${String(dt.getDate()).padStart(2, '0')}`
}

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return new Response('Missing slug', { status: 400 })

  const { data: post } = await supabase.from('posts').select('*').eq('slug', slug).single()
  if (!post) return new Response('Not found', { status: 404 })

  const cardColor = post.card_color || '#EAF3DE'
  const textColor = post.card_text_color || '#1B3A0A'
  const hasImage = Array.isArray(post.image_urls) && post.image_urls.length > 0
  const year = fmtYear(post.created_at)
  const date = fmtDate(post.created_at)
  const bodyText = truncate(post.content_text || '', hasImage ? 100 : 200)

  const allText = [`ZORAZHAO · ${year}`, 'zorazhao.com', date, post.title || '', bodyText].join('')
  const fonts = await loadFont(allText)

  let element: React.ReactElement

  if (hasImage) {
    element = (
      <div style={{ width: 1080, height: 1400, display: 'flex', flexDirection: 'column', fontFamily: 'Noto Serif SC' }}>
        <div style={{ display: 'flex', width: 1080, height: 812 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.image_urls[0]} width={1080} height={812} style={{ width: 1080, height: 812, objectFit: 'cover' }} alt="" />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: cardColor, padding: '56px 64px', color: textColor }}>
          {post.title ? (
            <div style={{ display: 'flex', fontSize: 40, fontWeight: 400, lineHeight: 1.35, marginBottom: 20 }}>
              {post.title}
            </div>
          ) : null}
          {bodyText ? (
            <div style={{ display: 'flex', fontSize: 26, lineHeight: 1.75, opacity: 0.75, flex: 1 }}>
              {bodyText}
            </div>
          ) : <div style={{ flex: 1, display: 'flex' }} />}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', fontSize: 20, opacity: 0.4, letterSpacing: '0.05em' }}>zorazhao.com</div>
            <div style={{ display: 'flex', fontSize: 18, opacity: 0.3 }}>{date}</div>
          </div>
        </div>
      </div>
    )
  } else {
    element = (
      <div style={{ width: 1080, height: 1350, display: 'flex', flexDirection: 'column', backgroundColor: cardColor, padding: '80px 96px', color: textColor, fontFamily: 'Noto Serif SC' }}>
        <div style={{ display: 'flex', fontSize: 22, opacity: 0.5, letterSpacing: '0.08em' }}>
          {`ZORAZHAO · ${year}`}
        </div>
        {post.title ? (
          <div style={{ display: 'flex', fontSize: 56, fontWeight: 400, lineHeight: 1.35, marginTop: 56 }}>
            {post.title}
          </div>
        ) : null}
        <div style={{ display: 'flex', width: 32, height: 2, backgroundColor: textColor, opacity: 0.3, marginTop: 40 }} />
        {bodyText ? (
          <div style={{ display: 'flex', fontSize: 28, lineHeight: 1.85, opacity: 0.8, marginTop: 32, flex: 1 }}>
            {bodyText}
          </div>
        ) : <div style={{ flex: 1, display: 'flex' }} />}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', fontSize: 22, opacity: 0.4, letterSpacing: '0.05em' }}>zorazhao.com</div>
          <div style={{ display: 'flex', fontSize: 20, opacity: 0.3 }}>{date}</div>
        </div>
      </div>
    )
  }

  const satori = (await import('satori')).default
  const { Resvg } = await import('@resvg/resvg-js')

  const svg = await satori(element, { width: 1080, height: hasImage ? 1400 : 1350, fonts })
  const pngBuffer = new Resvg(svg).render().asPng()

  return new Response(pngBuffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
