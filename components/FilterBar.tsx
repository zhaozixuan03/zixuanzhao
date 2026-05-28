'use client'
import { useRef, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  tags: string[]
  active: string | undefined
}

export default function FilterBar({ tags, active }: Props) {
  const router = useRouter()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showLeft, setShowLeft] = useState(false)
  const [showRight, setShowRight] = useState(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const check = () => {
      setShowLeft(el.scrollLeft > 4)
      setShowRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
    }
    check()
    el.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check, { passive: true })
    return () => {
      el.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
    }
  }, [tags])

  const go = (tag: string | null) => {
    if (tag) router.push(`/?tag=${encodeURIComponent(tag)}`)
    else router.push('/')
  }

  const cap = (isActive: boolean) =>
    `shrink-0 text-[11px] font-mono px-3 py-1 rounded-[30px] border transition-colors cursor-pointer whitespace-nowrap ${
      isActive
        ? 'bg-[#1a1a18] text-[#f5f4f0] border-[#1a1a18]'
        : 'border-stone-300 text-stone-500 hover:border-stone-600 hover:text-stone-700'
    }`

  return (
    <div style={{ position: 'relative' }}>
      {/* Left fade */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 40, zIndex: 1,
        background: 'linear-gradient(to left, transparent, #f5f4f0)',
        pointerEvents: 'none',
        opacity: showLeft ? 1 : 0, transition: 'opacity 0.2s',
      }} />
      {/* Right fade */}
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: 40, zIndex: 1,
        background: 'linear-gradient(to right, transparent, #f5f4f0)',
        pointerEvents: 'none',
        opacity: showRight ? 1 : 0, transition: 'opacity 0.2s',
      }} />
      <div
        ref={scrollRef}
        style={{ overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
        className="flex gap-2 [&::-webkit-scrollbar]:hidden"
      >
        <button onClick={() => go(null)} className={cap(!active)}>全部</button>
        {tags.map(tag => (
          <button key={tag} onClick={() => go(tag)} className={cap(active === tag)}>{tag}</button>
        ))}
      </div>
    </div>
  )
}
