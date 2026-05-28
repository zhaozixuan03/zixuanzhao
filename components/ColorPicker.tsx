'use client'
import { useState, useRef, useCallback, useEffect } from 'react'

function hsvToHex(h: number, s: number, v: number): string {
  const f = (n: number) => {
    const k = (n + h / 60) % 6
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1))
  }
  return '#' + [f(5), f(3), f(1)].map(x =>
    Math.round(x * 255).toString(16).padStart(2, '0')
  ).join('')
}

function hexToHsv(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
  const s = max === 0 ? 0 : d / max
  const v = max
  let h = 0
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60
    else if (max === g) h = ((b - r) / d + 2) * 60
    else h = ((r - g) / d + 4) * 60
  }
  return [h, s, v]
}

interface Props { value: string; onChange: (hex: string) => void }

const SIZE = 160

export default function ColorPicker({ value, onChange }: Props) {
  const init = /^#[0-9a-f]{6}$/i.test(value) ? hexToHsv(value) : [210, 0.45, 0.82] as [number, number, number]
  const [hue, setHue] = useState(init[0])
  const [sat, setSat] = useState(init[1])
  const [bri, setBri] = useState(init[2])
  const svDragging = useRef(false)
  const hueDragging = useRef(false)
  const svRef = useRef<HTMLDivElement>(null)
  const hueRef = useRef<HTMLDivElement>(null)
  const emittedRef = useRef(value)

  // Sync when external value changes (e.g. editing existing post)
  useEffect(() => {
    if (/^#[0-9a-f]{6}$/i.test(value) && value !== emittedRef.current) {
      const [h, s, v] = hexToHsv(value)
      setHue(h); setSat(s); setBri(v)
      emittedRef.current = value
    }
  }, [value])

  const emit = useCallback((h: number, s: number, v: number) => {
    const hex = hsvToHex(h, s, v)
    emittedRef.current = hex
    onChange(hex)
  }, [onChange])

  const updateSv = useCallback((clientX: number, clientY: number) => {
    const rect = svRef.current?.getBoundingClientRect()
    if (!rect) return
    const s = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const v = 1 - Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))
    setSat(s); setBri(v)
    emit(hue, s, v)
  }, [hue, emit])

  const updateHue = useCallback((clientX: number) => {
    const rect = hueRef.current?.getBoundingClientRect()
    if (!rect) return
    const h = Math.round(Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * 360)
    setHue(h)
    emit(h, sat, bri)
  }, [sat, bri, emit])

  useEffect(() => {
    const up = () => { svDragging.current = false; hueDragging.current = false }
    const move = (e: MouseEvent) => {
      if (svDragging.current) updateSv(e.clientX, e.clientY)
      if (hueDragging.current) updateHue(e.clientX)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
  }, [updateSv, updateHue])

  useEffect(() => {
    const svEl = svRef.current
    const hueEl = hueRef.current
    if (!svEl || !hueEl) return

    const svTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      svDragging.current = true
      updateSv(e.touches[0].clientX, e.touches[0].clientY)
    }
    const svTouchMove = (e: TouchEvent) => {
      if (!svDragging.current) return
      e.preventDefault()
      updateSv(e.touches[0].clientX, e.touches[0].clientY)
    }
    const svTouchEnd = () => { svDragging.current = false }

    const hueTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      hueDragging.current = true
      updateHue(e.touches[0].clientX)
    }
    const hueTouchMove = (e: TouchEvent) => {
      if (!hueDragging.current) return
      e.preventDefault()
      updateHue(e.touches[0].clientX)
    }
    const hueTouchEnd = () => { hueDragging.current = false }

    svEl.addEventListener('touchstart', svTouchStart, { passive: false })
    svEl.addEventListener('touchmove', svTouchMove, { passive: false })
    svEl.addEventListener('touchend', svTouchEnd)
    hueEl.addEventListener('touchstart', hueTouchStart, { passive: false })
    hueEl.addEventListener('touchmove', hueTouchMove, { passive: false })
    hueEl.addEventListener('touchend', hueTouchEnd)

    return () => {
      svEl.removeEventListener('touchstart', svTouchStart)
      svEl.removeEventListener('touchmove', svTouchMove)
      svEl.removeEventListener('touchend', svTouchEnd)
      hueEl.removeEventListener('touchstart', hueTouchStart)
      hueEl.removeEventListener('touchmove', hueTouchMove)
      hueEl.removeEventListener('touchend', hueTouchEnd)
    }
  }, [updateSv, updateHue])

  const hex = hsvToHex(hue, sat, bri)

  return (
    <div className="flex items-start gap-4">
      <div>
        {/* SV block */}
        <div
          ref={svRef}
          onMouseDown={e => { svDragging.current = true; updateSv(e.clientX, e.clientY) }}
          style={{
            width: SIZE, height: SIZE, position: 'relative', cursor: 'crosshair',
            borderRadius: 4, overflow: 'hidden', userSelect: 'none',
            background: `hsl(${hue}, 100%, 50%)`,
          }}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, white, transparent)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent, black)' }} />
          <div style={{
            position: 'absolute', pointerEvents: 'none',
            left: sat * SIZE - 5, top: (1 - bri) * SIZE - 5,
            width: 10, height: 10, border: '2px solid white', borderRadius: '50%',
            boxShadow: '0 0 2px rgba(0,0,0,0.4)',
          }} />
        </div>

        {/* Hue strip */}
        <div
          ref={hueRef}
          onMouseDown={e => { hueDragging.current = true; updateHue(e.clientX) }}
          style={{
            marginTop: 8, width: SIZE, height: 16, cursor: 'crosshair', borderRadius: 4,
            position: 'relative', userSelect: 'none',
            background: 'linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)',
          }}
        >
          <div style={{
            position: 'absolute', pointerEvents: 'none',
            left: (hue / 360) * SIZE - 5, top: -2,
            width: 10, height: 20, border: '2px solid white', borderRadius: 2,
            boxShadow: '0 0 2px rgba(0,0,0,0.4)',
          }} />
        </div>
      </div>

      {/* Preview + hex */}
      <div className="flex flex-col gap-2 pt-1">
        <div style={{ width: 48, height: 48, background: hex, borderRadius: 6, border: '1px solid rgba(0,0,0,0.1)' }} />
        <span className="text-[11px] font-mono text-stone-400 select-all">{hex}</span>
      </div>
    </div>
  )
}
