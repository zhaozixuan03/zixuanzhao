'use client'
import { useState, KeyboardEvent } from 'react'

interface Props { value: string[]; onChange: (tags: string[]) => void }

export default function TagInput({ value, onChange }: Props) {
  const [input, setInput] = useState('')

  const add = (raw: string) => {
    const tag = raw.trim().replace(/,/g, '')
    if (tag && !value.includes(tag)) onChange([...value, tag])
    setInput('')
  }

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(input) }
    if (e.key === 'Backspace' && !input && value.length > 0) onChange(value.slice(0, -1))
  }

  return (
    <div className="flex flex-wrap gap-1.5 items-center min-h-[32px]">
      {value.map(tag => (
        <span key={tag} className="flex items-center gap-1 text-[11px] font-mono bg-stone-100 px-2.5 py-1 rounded-full text-stone-600">
          {tag}
          <button
            type="button"
            onClick={() => onChange(value.filter(t => t !== tag))}
            className="text-stone-400 hover:text-stone-700 leading-none ml-0.5"
          >×</button>
        </span>
      ))}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={onKey}
        onBlur={() => input && add(input)}
        placeholder={value.length === 0 ? '输入标签，回车确认' : ''}
        className="flex-1 min-w-[120px] text-[12px] font-mono bg-transparent outline-none text-stone-600 placeholder-stone-300"
      />
    </div>
  )
}
