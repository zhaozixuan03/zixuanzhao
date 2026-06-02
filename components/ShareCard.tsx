import { processContent } from '@/lib/paginate'

const SERIF = "'Noto Serif SC', Georgia, 'Times New Roman', serif"

interface Props {
  title: string | null
  content: string
  cardColor: string
  cardTextColor: string
  hasImage: boolean
  imageUrl?: string
  createdAt: string
}

export default function ShareCard({ title, content, cardColor, cardTextColor, hasImage, imageUrl, createdAt }: Props) {
  const processedContent = processContent(content)
  const dateStr = new Date(createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
  const year = new Date(createdAt).getFullYear()

  return (
    <div
      id="card"
      style={{
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
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=""
          style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 8, marginBottom: 48 }}
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
  )
}
