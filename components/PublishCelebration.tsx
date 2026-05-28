'use client'
import { useEffect, useState } from 'react'

interface Props {
  cardColor: string | null
  isNew: boolean
}

export default function PublishCelebration({ cardColor, isNew }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [showSprout, setShowSprout] = useState(false)

  useEffect(() => {
    if (!isNew) return
    const t1 = setTimeout(() => setExpanded(true), 50)
    const t2 = setTimeout(() => setShowSprout(true), 300)
    const t3 = setTimeout(() => setShowSprout(false), 2500)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [isNew])

  if (!cardColor) return null

  if (!isNew) {
    return <div style={{ height: 8, background: cardColor }} />
  }

  return (
    <>
      <div style={{ position: 'relative', height: 8, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: 0, bottom: 0, right: '50%',
          background: cardColor,
          width: expanded ? '50%' : 0,
          transition: 'width 1s ease-out',
        }} />
        <div style={{
          position: 'absolute', top: 0, bottom: 0, left: '50%',
          background: cardColor,
          width: expanded ? '50%' : 0,
          transition: 'width 1s ease-out',
        }} />
      </div>
      {showSprout && (
        <div
          className="sprout-pop"
          style={{
            position: 'fixed', left: '50%', top: '50%', zIndex: 999,
            fontSize: 48, pointerEvents: 'none',
          }}
        >
          🌱
        </div>
      )}
    </>
  )
}
