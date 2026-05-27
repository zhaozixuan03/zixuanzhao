'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'

interface Props {
  dates: string[]
  totalPosts: number
  totalWords: number
}

const DAYS = 7
const CELL = 11
const GAP = 3
// 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
const DAY_LABELS: Record<number, string> = { 0: 'Mon', 2: 'Wed', 4: 'Fri' }

function localKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function ContributionGrid({ dates, totalPosts, totalWords }: Props) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth()) // 0-indexed

  // Build per-day counts from all dates
  const counts = useMemo(() => {
    const map: Record<string, number> = {}
    dates.forEach(d => {
      const key = d.slice(0, 10)
      map[key] = (map[key] || 0) + 1
    })
    return map
  }, [dates])

  // Years that have data + current year, descending
  const availableYears = useMemo(() => {
    const ys = new Set<number>([new Date().getFullYear()])
    dates.forEach(d => ys.add(parseInt(d.slice(0, 4))))
    return Array.from(ys).sort((a, b) => b - a)
  }, [dates])

  const { cells, numWeeks, monthDays, monthPosts, todayKey } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tk = localKey(today)

    const firstDay = new Date(year, month, 1)
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    // Day offset so grid rows start on Monday (0=Mon … 6=Sun)
    const firstDayOfWeek = (firstDay.getDay() + 6) % 7
    const nw = Math.ceil((firstDayOfWeek + daysInMonth) / 7)

    const gridStart = new Date(firstDay)
    gridStart.setDate(gridStart.getDate() - firstDayOfWeek)

    const cs: { date: Date; key: string; inMonth: boolean; isFuture: boolean }[] = []
    for (let col = 0; col < nw; col++) {
      for (let row = 0; row < DAYS; row++) {
        const d = new Date(gridStart)
        d.setDate(d.getDate() + col * DAYS + row)
        cs.push({
          date: d,
          key: localKey(d),
          inMonth: d.getMonth() === month && d.getFullYear() === year,
          isFuture: d > today,
        })
      }
    }

    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}-`
    const mDays = Object.entries(counts).filter(([k, v]) => k.startsWith(monthPrefix) && v > 0).length
    const mPosts = dates.filter(d => d.startsWith(monthPrefix)).length

    return { cells: cs, numWeeks: nw, monthDays: mDays, monthPosts: mPosts, todayKey: tk }
  }, [year, month, counts, dates])

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()
  const todayWrote = isCurrentMonth && (counts[todayKey] || 0) > 0

  const goPrev = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  const goNext = () => {
    if (isCurrentMonth) return
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }
  const changeYear = (newYear: number) => {
    setYear(newYear)
    if (newYear === now.getFullYear() && month > now.getMonth()) {
      setMonth(now.getMonth())
    }
  }

  function cellStyle(cell: typeof cells[0]): React.CSSProperties {
    if (!cell.inMonth) return { width: CELL, height: CELL }
    const isToday = cell.key === todayKey && isCurrentMonth
    if (isToday) {
      const wrote = (counts[todayKey] || 0) > 0
      return {
        width: CELL, height: CELL,
        background: wrote ? '#3B6D11' : 'transparent',
        outline: wrote ? undefined : '1.5px dashed #97C459',
        transform: 'scale(1.3)',
        position: 'relative' as const,
        zIndex: 1,
      }
    }
    if (cell.isFuture) return { width: CELL, height: CELL, background: '#f0ede6' }
    const c = counts[cell.key] || 0
    const bg = c === 0 ? '#e8e6e0' : c === 1 ? '#C0DD97' : c <= 3 ? '#97C459' : '#3B6D11'
    return { width: CELL, height: CELL, background: bg }
  }

  const wordsFmt = totalWords >= 10000
    ? `${(totalWords / 10000).toFixed(1)}w`
    : totalWords.toLocaleString()

  return (
    <div className="py-10 border-b border-stone-200">
      {/* Stats header */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="text-[40px] font-medium text-[#3B6D11] leading-none font-sans">{monthDays}</div>
          <div className="text-[12px] text-[#639922] mt-1 font-sans">{month + 1}月种下了 {monthDays} 次</div>
        </div>
        <div className="flex gap-6 text-right">
          <div>
            <div className="text-[16px] font-medium text-stone-700 font-sans">{monthPosts}</div>
            <div className="text-[11px] text-stone-400 font-sans">本月篇数</div>
          </div>
          <div>
            <div className="text-[16px] font-medium text-stone-700 font-sans">{wordsFmt}</div>
            <div className="text-[11px] text-stone-400 font-sans">总字数</div>
          </div>
        </div>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={goPrev}
            className="text-stone-400 hover:text-stone-700 transition-colors font-sans text-[16px] leading-none"
          >←</button>
          <span className="text-[13px] text-stone-600 font-sans min-w-[72px] text-center">
            {year}年{month + 1}月
          </span>
          <button
            onClick={goNext}
            disabled={isCurrentMonth}
            className="text-stone-400 hover:text-stone-700 transition-colors font-sans text-[16px] leading-none disabled:opacity-25 disabled:cursor-not-allowed"
          >→</button>
        </div>
        <select
          value={year}
          onChange={e => changeYear(Number(e.target.value))}
          className="text-[11px] text-stone-400 font-sans bg-transparent border-none outline-none cursor-pointer"
        >
          {availableYears.map(y => <option key={y} value={y}>{y}年</option>)}
        </select>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <div style={{ display: 'inline-block' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {/* Weekday labels */}
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

            {/* Week columns */}
            <div style={{ display: 'flex', gap: GAP }}>
              {Array.from({ length: numWeeks }).map((_, col) => (
                <div key={col} style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
                  {Array.from({ length: DAYS }).map((_, row) => {
                    const cell = cells[col * DAYS + row]
                    if (!cell) return <div key={row} style={{ width: CELL, height: CELL }} />
                    return (
                      <div
                        key={row}
                        className="rounded-[2px] grid-cell"
                        style={cellStyle(cell)}
                        title={
                          cell.inMonth
                            ? `${cell.date.toLocaleDateString('zh')}${counts[cell.key] ? ` · 写了 ${counts[cell.key]} 篇` : ''}`
                            : ''
                        }
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Status line + legend */}
      <div className="flex items-center justify-between mt-3">
        <div>
          {isCurrentMonth && (
            todayWrote ? (
              <span className="text-[12px] font-sans" style={{ color: '#639922' }}>
                今天亮了 · {month + 1}月第 {monthDays} 次 ✦
              </span>
            ) : (
              <Link href="/write" className="text-[12px] font-sans text-stone-400 hover:text-stone-700 transition-colors">
                今天还没种字——哪怕一句话 →
              </Link>
            )
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-stone-400 font-sans">少</span>
          {['#e8e6e0', '#C0DD97', '#97C459', '#3B6D11'].map((c, i) => (
            <div key={i} className="rounded-[2px]" style={{ width: 9, height: 9, background: c }} />
          ))}
          <span className="text-[10px] text-stone-400 font-sans">多</span>
        </div>
      </div>
    </div>
  )
}
