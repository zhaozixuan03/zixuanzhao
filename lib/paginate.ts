const SERIF = "'Noto Serif SC', Georgia, 'Times New Roman', serif"
const COL_WIDTH = 904    // 1080 - 88*2
const BODY_FONT = 28
const BODY_LH = 1.85
const PAGE_BODY_BUDGET = 1180  // per-page body height budget (px)

export function processContent(html: string): string {
  return html
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
}

// Measure block heights in the browser and split into pages.
// Cut points fall between top-level block elements — never mid-line.
export function paginateContent(processedHtml: string): string[] {
  const m = document.createElement('div')
  m.style.cssText =
    `position:absolute;left:-99999px;top:0;width:${COL_WIDTH}px;` +
    `font-family:${SERIF};font-size:${BODY_FONT}px;line-height:${BODY_LH};` +
    `opacity:0;pointer-events:none;`
  m.innerHTML = processedHtml
  document.body.appendChild(m)

  try {
    const blocks = Array.from(m.children) as HTMLElement[]
    if (blocks.length === 0) return [processedHtml]

    const pages: string[] = []
    let cur: string[] = []
    let curH = 0

    const flush = () => {
      if (cur.length) { pages.push(cur.join('')); cur = []; curH = 0 }
    }

    for (const block of blocks) {
      const h = block.getBoundingClientRect().height
      const cs = getComputedStyle(block)
      const need = h + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom)

      // Block taller than a full page → give it its own page
      if (need > PAGE_BODY_BUDGET) {
        flush()
        pages.push(block.outerHTML)
        continue
      }
      // Current page would overflow → close it
      if (curH + need > PAGE_BODY_BUDGET && cur.length) flush()
      cur.push(block.outerHTML)
      curH += need
    }
    flush()
    return pages.length ? pages : [processedHtml]
  } finally {
    document.body.removeChild(m)
  }
}
