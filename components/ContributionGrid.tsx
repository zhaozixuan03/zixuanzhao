'use client'
import { useMemo } from 'react'

interface Props {
  dates: string[]  // ISO date strings of days written
  totalPosts: number
  totalWords: number
}

const WEEKS = 53
const DAYS = 7

function getLevel(count: number): number {
  if (count === 0) return 0
  if (count === 1) return 2
  if (count <= 3) return 3
  return 4
}

const COLORS = ['#e8e8e4', '#C0DD97', '#97C459', '#639922', '#3B6D11']

export default function ContributionGrid({ dates, totalPosts, totalWords }: Props) {
  const { grid, todayIdx, maxStreak, thisYear } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const start = new Date(today)
    start.setDate(start.getDate() - (WEEKS * DAYS - 1))

    // Count writes per day
    const counts: Record<string, number> = {}
    dates.forEach(d => {
      const key = d.slice(0, 10)
      counts[key] = (counts[key] || 0) + 1
    })

    const cells: { date: Date; count: number; level: number }[] = []
    for (let i = 0; i < WEEKS * DAYS; i++) {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      const key = d.toISOString().slice(0, 10)
      const count = counts[key] || 0
      cells.push({ date: d, count, level: getLevel(count) })
    }

    const todayKey = today.toISOString().slice(0, 10)
    const todayIdx = cells.findIndex(c => c.date.toISOString().slice(0, 10) === todayKey)

    // Calculate streak
    let maxStreak = 0, cur = 0
    cells.forEach(c => {
      if (c.count > 0) { cur++; maxStreak = Math.max(maxStreak, cur) }
      else cur = 0
    })

    const thisYear = Object.entries(counts)
      .filter(([k]) => k.startsWith(new Date().getFullYear().toString()))
      .filter(([, v]) => v > 0).length

    return { grid: cells, todayIdx, maxStreak, thisYear }
  }, [dates])

  const todayWrote = todayIdx >= 0 && grid[todayIdx]?.count > 0
  const wk = Math.ceil(grid.length / DAYS)

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

      {/* Grid */}
      <div className="overflow-x-auto">
        <div className="flex gap-[3px]" style={{ width: `${wk * 14}px` }}>
          {Array.from({ length: wk }).map((_, w) => (
            <div key={w} className="flex flex-col gap-[3px]">
              {Array.from({ length: DAYS }).map((_, d) => {
                const idx = w * DAYS + d
                const cell = grid[idx]
                if (!cell) return <div key={d} style={{ width: 11, height: 11 }} />
                const isToday = idx === todayIdx
                return (
                  <div
                    key={d}
                    className="rounded-[2px] grid-cell"
                    style={{
                      width: 11, height: 11,
                      background: COLORS[cell.level],
                      outline: isToday ? '1.5px solid #3B6D11' : 'none',
                      outlineOffset: '1px',
                    }}
                    title={`${cell.date.toLocaleDateString('zh')}${cell.count > 0 ? ` · 写了 ${cell.count} 篇` : ''}`}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1 mt-2 justify-end">
        <span className="text-[10px] text-stone-400 font-sans">少</span>
        {COLORS.map((c, i) => (
          <div key={i} className="rounded-[2px]" style={{ width: 9, height: 9, background: c }} />
        ))}
        <span className="text-[10px] text-stone-400 font-sans">多</span>
      </div>

      {/* Today banner */}
      <div className={`mt-5 px-5 py-4 rounded-lg flex justify-between items-center ${todayWrote ? 'bg-stone-100' : 'bg-[#EAF3DE]'}`}>
        {todayWrote ? (
          <>
            <div>
              <div className="text-[14px] font-medium text-stone-700 font-sans">今天写了 ✓</div>
              <div className="text-[12px] text-stone-500 font-sans mt-0.5">今年第 {thisYear} 次，慢慢来。</div>
            </div>
            <a href="/write" className="text-[12px] px-4 py-2 rounded-full bg-stone-200 text-stone-500 font-sans">继续写</a>
          </>
        ) : (
          <>
            <div>
              <div className="text-[14px] font-medium text-[#3B6D11] font-sans">今天还没种字</div>
              <div className="text-[12px] text-[#639922] font-sans mt-0.5">哪怕一句话，今天这格就亮了 :)</div>
            </div>
            <a href="/write" className="text-[12px] px-4 py-2 rounded-full bg-[#3B6D11] text-[#EAF3DE] font-sans">去写 →</a>
          </>
        )}
      </div>
    </div>
  )
}
