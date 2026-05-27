'use client'
import { useMemo } from 'react'
import Link from 'next/link'

interface Props {
  dates: string[]
  totalPosts: number
  totalWords: number
}

const WEEKS = 53
const DAYS = 7
const CELL = 11
const GAP = 3
const STEP = CELL + GAP

function getLevel(count: number): number {
  if (count === 0) return 0
  if (count === 1) return 1
  if (count <= 3) return 2
  return 3
}

// Index 0-3: 0篇 / 1篇 / 2-3篇 / 4篇+；今天格子单独处理，不走这个数组
const COLORS = ['#e2e8d9', '#C0DD97', '#97C459', '#639922']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAY_LABELS: Record<number, string> = { 1: 'Mon', 3: 'Wed', 5: 'Fri' }

export default function ContributionGrid({ dates, totalPosts, totalWords }: Props) {
  const { grid, todayIdx, thisYear, wk } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const start = new Date(today)
    start.setDate(start.getDate() - (WEEKS * DAYS - 1))

    const counts: Record<string, number> = {}
    dates.forEach(d => {
      const key = d.slice(0, 10)
      counts[key] = (counts[key] || 0) + 1
    })

    const cells: { date: Date; count: number; level: number }[] = []
    for (let i = 0; i < WEEKS * DAYS; i++) {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const count = counts[key] || 0
      cells.push({ date: d, count, level: getLevel(count) })
    }

    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const todayIdx = cells.findIndex(c => {
      const d = c.date
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` === todayKey
    })

    const thisYear = Object.entries(counts)
      .filter(([k]) => k.startsWith(new Date().getFullYear().toString()))
      .filter(([, v]) => v > 0).length

    const wk = Math.ceil(cells.length / DAYS)

    console.log('today cell:', todayIdx, cells[todayIdx])
    return { grid: cells, todayIdx, thisYear, wk }
  }, [dates])

  const todayWrote = todayIdx >= 0 && grid[todayIdx]?.count > 0

  const monthLabels: { w: number; label: string }[] = []
  let prevMonth = -1
  for (let w = 0; w < wk; w++) {
    const cell = grid[w * DAYS]
    if (!cell) continue
    const m = cell.date.getMonth()
    if (m !== prevMonth) {
      monthLabels.push({ w, label: MONTHS[m] })
      prevMonth = m
    }
  }

  const LEFT_OFFSET = 28 + 4

  return (
    <div className="py-10 border-b border-stone-200">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="text-[40px] font-medium text-[#3B6D11] leading-none font-sans">{thisYear}</div>
          <div className="text-[12px] text-[#639922] mt-1 font-sans">今年种下了 {thisYear} 次</div>
        </div>
        <div className="flex gap-6 text-right">
          <div>
            <div className="text-[16px] font-medium text-stone-700 font-sans">{totalPosts}</div>
            <div className="text-[11px] text-stone-400 font-sans">篇文字</div>
          </div>
          <div>
            <div className="text-[16px] font-medium text-stone-700 font-sans">
              {totalWords >= 10000 ? `${(totalWords / 10000).toFixed(1)}w` : totalWords.toLocaleString()}
            </div>
            <div className="text-[11px] text-stone-400 font-sans">总字数</div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div style={{ display: 'inline-block' }}>
          {/* Month labels */}
          <div style={{ position: 'relative', height: 14, marginBottom: 4, marginLeft: LEFT_OFFSET }}>
            {monthLabels.map(({ w, label }) => (
              <span
                key={w}
                style={{
                  position: 'absolute',
                  left: w * STEP,
                  fontSize: 9,
                  color: '#aaa',
                  fontFamily: '-apple-system, sans-serif',
                  lineHeight: '14px',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Weekday labels + cells */}
          <div style={{ display: 'flex', gap: 4 }}>
            <div style={{ width: 28, display: 'flex', flexDirection: 'column', gap: GAP }}>
              {Array.from({ length: DAYS }).map((_, d) => (
                <div
                  key={d}
                  style={{
                    height: CELL,
                    lineHeight: `${CELL}px`,
                    fontSize: 9,
                    color: '#aaa',
                    textAlign: 'right',
                    fontFamily: '-apple-system, sans-serif',
                    paddingRight: 2,
                  }}
                >
                  {DAY_LABELS[d] ?? ''}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: GAP }}>
              {Array.from({ length: wk }).map((_, w) => (
                <div key={w} style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
                  {Array.from({ length: DAYS }).map((_, d) => {
                    const idx = w * DAYS + d
                    const cell = grid[idx]
                    if (!cell) return <div key={d} style={{ width: CELL, height: CELL }} />
                    const isToday = idx === todayIdx
                    const todayWrote = isToday && cell.count > 0
                    const todayEmpty = isToday && cell.count === 0
                    return (
                      <div
                        key={d}
                        className="rounded-[2px] grid-cell"
                        style={{
                          width: CELL,
                          height: CELL,
                          background: todayWrote ? '#3B6D11' : todayEmpty ? 'transparent' : COLORS[cell.level],
                          outline: todayEmpty ? '1.5px dashed #97C459' : undefined,
                          transform: isToday ? 'scale(1.3)' : undefined,
                          position: isToday ? 'relative' : undefined,
                          zIndex: isToday ? 1 : undefined,
                        }}
                        title={`${cell.date.toLocaleDateString('zh')}${cell.count > 0 ? ` · 写了 ${cell.count} 篇` : ''}`}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3">
        <div>
          {todayWrote ? (
            <span className="text-[12px] font-sans" style={{ color: '#639922' }}>
              今天亮了 · 今年第 {thisYear} 次 ✦
            </span>
          ) : (
            <Link href="/write" className="text-[12px] font-sans text-stone-400 hover:text-stone-700 transition-colors">
              今天还没种字——哪怕一句话 →
            </Link>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-stone-400 font-sans">少</span>
          {COLORS.map((c, i) => (
            <div key={i} className="rounded-[2px]" style={{ width: 9, height: 9, background: c }} />
          ))}
          <span className="text-[10px] text-stone-400 font-sans">多</span>
        </div>
      </div>
    </div>
  )
}
