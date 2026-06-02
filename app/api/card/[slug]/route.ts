export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

import { NextRequest } from 'next/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  let browser: import('puppeteer-core').Browser | null = null
  try {
    const chromium = (await import('@sparticuz/chromium')).default
    const puppeteer = (await import('puppeteer-core')).default

    chromium.setGraphicsMode = false

    browser = await puppeteer.launch({
      args: [...chromium.args, '--no-sandbox', '--disable-dev-shm-usage'],
      executablePath: process.env.CHROME_EXECUTABLE_PATH || await chromium.executablePath(),
      headless: chromium.headless,
    })

    const page = await browser.newPage()
    await page.setViewport({ width: 1080, height: 1200, deviceScaleFactor: 3 })

    const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.zorazhao.com'
    const res = await page.goto(`${base}/p/${encodeURIComponent(slug)}/card`, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    })

    if (!res || res.status() === 404) {
      return new Response('Not found', { status: 404 })
    }

    await page.evaluateHandle('document.fonts.ready')
    await page.evaluate(() => new Promise(r => setTimeout(r, 300)))

    const el = await page.$('#card')
    if (!el) return new Response('Card element not found', { status: 500 })

    const buf = await el.screenshot({ type: 'png' })

    return new Response(buf as unknown as BodyInit, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (err) {
    console.error('card render failed:', err)
    return new Response(
      'CARD_ERROR\n' + (err instanceof Error ? `${err.message}\n${err.stack}` : String(err)),
      { status: 500, headers: { 'Content-Type': 'text/plain' } }
    )
  } finally {
    if (browser) await browser.close()
  }
}
