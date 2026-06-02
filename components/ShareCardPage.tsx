const SERIF = "'Noto Serif SC', Georgia, 'Times New Roman', serif"

interface Props {
  pageHtml: string
  title: string | null
  cardColor: string
  cardTextColor: string
  hasImage: boolean
  imageUrl?: string
  createdAt: string
  pageIndex: number
  pageCount: number
}

export default function ShareCardPage({ pageHtml, title, cardColor, cardTextColor, hasImage, imageUrl, createdAt, pageIndex, pageCount }: Props) {
  const isFirst = pageIndex === 0
  const isLast = pageIndex === pageCount - 1
  const multi = pageCount > 1
  const dateStr = new Date(createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
  const year = new Date(createdAt).getFullYear()

  return (
    <div
      id="card"
      style={{
        width: 1080,
        minHeight: 1350,
        background: cardColor,
        color: cardTextColor,
        padding: '96px 88px 72px',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: SERIF,
        boxSizing: 'border-box',
      }}
    >
      {/* 页眉 */}
      <div style={{ fontFamily: 'Courier New, monospace', fontSize: 22, opacity: 0.5, letterSpacing: '0.14em', marginBottom: isFirst ? 56 : 24 }}>
        ZIXUAN ZHAO · {year}
      </div>

      {isFirst ? (
        <>
          {hasImage && imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 8, marginBottom: 48 }} />
          )}
          {title && (
            <div style={{ fontSize: hasImage ? 40 : 56, fontWeight: 400, lineHeight: 1.35, letterSpacing: '-0.01em', marginBottom: 32 }}>
              {title}
            </div>
          )}
          {!hasImage && <div style={{ width: 32, height: 2, background: cardTextColor, opacity: 0.3, marginBottom: 32 }} />}
        </>
      ) : (
        <div style={{ fontSize: 24, opacity: 0.55, marginBottom: 20, paddingBottom: 12, borderBottom: `1px solid ${cardTextColor}1A` }}>
          {title || '　'}<span style={{ opacity: 0.6 }}>·（续）</span>
        </div>
      )}

      {multi && !isFirst && (
        <div style={{ fontSize: 22, opacity: 0.35, marginBottom: 16 }}>⋯ 接上页</div>
      )}

      <div
        dangerouslySetInnerHTML={{ __html: pageHtml }}
        style={{ fontSize: 28, lineHeight: 1.85, opacity: 0.82, flex: 1 }}
      />

      {multi && !isLast && (
        <div style={{ fontSize: 22, opacity: 0.35, marginTop: 16, textAlign: 'right' }}>下接 ⋯</div>
      )}

      {/* 页脚 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 48, paddingTop: 32, borderTop: `1px solid ${cardTextColor}20` }}>
        <div style={{ fontFamily: 'Courier New, monospace', fontSize: 22, opacity: 0.4, letterSpacing: '0.06em' }}>zorazhao.com</div>
        <div style={{ display: 'flex', gap: 20, fontFamily: 'Courier New, monospace', opacity: 0.35 }}>
          {multi && <span style={{ fontSize: 20 }}>{pageIndex + 1} / {pageCount}</span>}
          <span style={{ fontSize: 20 }}>{dateStr}</span>
        </div>
      </div>
    </div>
  )
}
