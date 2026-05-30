'use client'

interface Props {
  createdAt: string
  editHistory: string[]
}

function timeOfDay(iso: string): string {
  const h = new Date(iso).getHours()
  if (h >= 23 || h < 5) return '深夜'
  if (h < 9) return '清晨'
  if (h < 12) return '上午'
  if (h < 14) return '中午'
  if (h < 18) return '下午'
  if (h < 20) return '傍晚'
  return '夜里'
}

function fmtDate(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function EditHistory({ createdAt, editHistory }: Props) {
  const all = [{ type: '种下', iso: createdAt }, ...editHistory.map(iso => ({ type: '浇水', iso }))]

  return (
    <div style={{ paddingTop: 16, borderTop: '0.5px solid #e8e6e0' }}>
      {all.map((entry, i) => {
        const isLast = i === all.length - 1
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, fontFamily: 'monospace', fontSize: 12, color: '#aaa' }}>
            <span>{entry.type === '种下' ? '🌱' : '💧'}</span>
            <span style={{ color: '#666' }}>{entry.type}</span>
            <span>{fmtDate(entry.iso)}</span>
            <span>{timeOfDay(entry.iso)}</span>
            {isLast && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#97C459', display: 'inline-block', flexShrink: 0 }} />}
          </div>
        )
      })}
    </div>
  )
}
