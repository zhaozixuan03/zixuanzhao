'use client'
import { useEffect, useState } from 'react'

interface Props {
  cardColor: string | null
  isNew: boolean
}

export default function PublishCelebration({ cardColor, isNew }: Props) {
  const [barWidth, setBarWidth] = useState(isNew ? 0 : 100)
  const [showSprout, setShowSprout] = useState(false)

  useEffect(() => {
    if (!isNew) return
    const t1 = setTimeout(() => setBarWidth(100), 50)
    const t2 = setTimeout(() => setShowSprout(true), 400)
    const t3 = setTimeout(() => setShowSprout(false), 2600)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [isNew])

  if (!cardColor) return null

  return (
    <>
      <div style={{
        height: 8,
        background: cardColor,
        width: `${barWidth}%`,
        transition: isNew ? 'width 0.9s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
      }} />
      {showSprout && (
        <div className="sprout-anim" style={{
          position: 'fixed', top: 24, right: 24, zIndex: 999,
          fontSize: 32, pointerEvents: 'none',
        }}>
          🌱
        </div>
      )}
    </>
  )
}
