'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'

interface Props {
  dates: string[]
  totalPosts: number
  totalWords: number
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAY_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

function localKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

interface Cell {
  date: Date
  key: string
  inMonth: boolean
  isFuture: boolean
  dayOfMonth: number
}

export default function ContributionGrid({ dates, totalPosts, totalWords }: Props) {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const counts = useMemo(() => {
    const map: Record<string, number> = {}
    dates.forEach(d => {
      const key = d.slice(0, 10)
      map[key] = (map[key] || 0) + 1
    })
    return map
  }, [dates])

  const earliestYear = useMemo(() => {
    if (dates.length === 0) return now.getFullYear()
    return Math.min(...dates.map(d => parseInt(d.slice(0, 4))))
  }, [dates])

  const earliestMonth = useMemo(() => {
    const earliest = dates.filter(d => parseInt(d.slice(0, 4)) === earliestYear)
    if (earliest.length === 0) return 0
    return Math.min(...earliest.map(d => parseInt(d.slice(5, 7)) - 1))
  }, [dates, earliestYear])

  const { weeks, monthPosts, todayKey, todayN } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tk = localKey(today)

    const firstDay = new Date(year, month, 1)
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDayOfWeek = (firstDay.getDay() + 6) % 7 // 0=Mon
    const numWeeks = Math.ceil((firstDayOfWeek + daysInMonth) / 7)

    const gridStart = new Date(firstDay)
    gridStart.setDate(gridStart.getDate() - firstDayOfWeek)

    // rows = weeks, cols = Mon..Sun
    const ws: Cell[][] = []
    for (let w = 0; w < numWeeks; w++) {
      const row: Cell[] = []
      for (let d = 0; d < 7; d++) {
        const date = new Date(gridStart)
        date.setDate(date.getDate() + w * 7 + d)
        row.push({
          date,
          key: localKey(date),
          inMonth: date.getMonth() === month && date.getFullYear() === year,
          isFuture: date > today,
          dayOfMonth: date.getDate(),
        })
      }
      ws.push(row)
    }

    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}-`
    const mPosts = dates.filter(d => d.startsWith(monthPrefix)).length

    const monthPosts = mPosts
    // count of days this month with at least 1 post
    const monthDaysWithPost = Object.entries(counts).filter(([k]) => k.startsWith(monthPrefix) && (counts[k] || 0) > 0).length

    // ordinal: how many-th day in month did today write
    const todayOrdinal = Object.keys(counts)
      .filter(k => k.startsWith(monthPrefix) && (counts[k] || 0) > 0)
      .sort()
      .indexOf(tk) + 1

    return { weeks: ws, monthPosts, todayKey: tk, todayN: todayOrdinal > 0 ? todayOrdinal : monthDaysWithPost }
  }, [year, month, counts, dates])

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()
  const isEarliestMonth = year === earliestYear && month === earliestMonth
  const todayWrote = isCurrentMonth && (counts[todayKey] || 0) > 0

  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}-`
  const monthDaysWithPost = Object.keys(counts).filter(k => k.startsWith(monthPrefix) && (counts[k] || 0) > 0).length

  const goPrev = () => {
    if (isEarliestMonth) return
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  const goNext = () => {
    if (isCurrentMonth) return
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  function cellStyle(cell: Cell): React.CSSProperties {
    if (!cell.inMonth) return { background: 'transparent' }
    const isToday = cell.key === todayKey && isCurrentMonth
    if (isToday) {
      const wrote = (counts[todayKey] || 0) > 0
      if (wrote) {
        return { position: 'relative', zIndex: 1, background: '#3B6D11', color: '#EAF3DE', fontWeight: 500 }
      }
      return {
        position: 'relative', zIndex: 1,
        background: '#f5f4f0',
        border: '2px solid #97C459',
        color: '#3B6D11', fontWeight: 600,
      }
    }
    if (cell.isFuture) return { background: '#f0ede6', color: '#ccc' }
    const c = counts[cell.key] || 0
    if (c === 0) return { background: '#e8e6e0', color: '#999' }
    if (c === 1) return { background: '#C0DD97', color: '#5a7a2a' }
    if (c <= 3) return { background: '#97C459', color: '#3B6D11' }
    return { background: '#3B6D11', color: '#fff' }
  }

  function tooltipText(cell: Cell): string {
    if (!cell.inMonth) return ''
    const isToday = cell.key === todayKey && isCurrentMonth
    const c = counts[cell.key] || 0
    if (isToday && c === 0) return '今天还没写'
    if (c === 0) return `${cell.date.getMonth() + 1}/${cell.date.getDate()}`
    return `${cell.date.getMonth() + 1}/${cell.date.getDate()} · ${c} 篇`
  }

  return (
    <div className="py-8 border-b border-stone-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-baseline gap-2">
          <button
            onClick={goPrev}
            disabled={isEarliestMonth}
            className="text-stone-300 hover:text-stone-600 transition-colors text-[16px] leading-none disabled:opacity-20 disabled:cursor-not-allowed"
          >←</button>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 24, color: '#333', fontWeight: 400 }}>
            {MONTH_NAMES[month]}
          </span>
          <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#bbb' }}>
            {year}
          </span>
          <button
            onClick={goNext}
            disabled={isCurrentMonth}
            className="text-stone-300 hover:text-stone-600 transition-colors text-[16px] leading-none disabled:opacity-20 disabled:cursor-not-allowed"
          >→</button>
        </div>
        <div className="text-right">
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 32, color: '#3B6D11', lineHeight: 1 }}>
            {monthPosts}
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#aaa', marginTop: 2 }}>
            这个月种下了 {monthPosts} 次
          </div>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-center" style={{ fontFamily: 'monospace', fontSize: 11, color: '#bbb' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex flex-col gap-[2px]">
        {weeks.map((row, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-[2px]">
            {row.map((cell, di) => {
              const isToday = cell.key === todayKey && isCurrentMonth
              const dotColor = (counts[todayKey] || 0) > 0 ? 'white' : '#97C459'
              return (
                <div
                  key={di}
                  title={tooltipText(cell)}
                  className={`rounded-[3px] flex items-center justify-center ${
                    cell.inMonth
                      ? 'hover:scale-[1.05] hover:shadow-[0_2px_8px_rgba(0,0,0,0.1)] cursor-pointer'
                      : 'cursor-default'
                  }`}
                  style={{
                    aspectRatio: '1',
                    fontSize: 11,
                    fontFamily: 'monospace',
                    userSelect: 'none',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                    ...cellStyle(cell),
                  }}
                >
                  {isToday && (
                    <div style={{
                      position: 'absolute', top: 8, right: 8,
                      width: 7, height: 7, borderRadius: '50%',
                      background: dotColor, pointerEvents: 'none',
                    }} />
                  )}
                  {cell.inMonth ? cell.dayOfMonth : ''}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Status line + legend */}
      <div className="flex items-center justify-between mt-3">
        <div>
          {isCurrentMonth && (
            todayWrote ? (
              <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#639922' }}>
                今天亮了 · {month + 1}月第{todayN}次 ✦
              </span>
            ) : (
              <Link href="/write" className="transition-colors" style={{ fontFamily: 'monospace', fontSize: 12, color: '#bbb' }}>
                今天还没种字——哪怕一句话 →
              </Link>
            )
          )}
        </div>
        <div className="flex items-center gap-1">
          <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#bbb' }}>少</span>
          {(['#e8e6e0', '#C0DD97', '#97C459', '#3B6D11'] as const).map((c, i) => (
            <div key={i} className="rounded-[2px]" style={{ width: 9, height: 9, background: c }} />
          ))}
          <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#bbb' }}>多</span>
        </div>
      </div>
    </div>
  )
}
