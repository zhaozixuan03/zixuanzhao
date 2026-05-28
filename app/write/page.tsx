'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Visibility } from '@/lib/supabase'
import { Eye, Lock, ChevronDown, Trash2 } from 'lucide-react'

function hslToHex(h: number, s: number, l: number): string {
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h * 12) % 12
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    return Math.round(255 * c).toString(16).padStart(2, '0')
  }
  return '#' + f(0) + f(8) + f(4)
}

function getHarmonyColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2
  const d = max - min
  let h = 0, s = 0
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
  }
  const lum = 0.299 * r + 0.587 * g + 0.114 * b
  if (lum > 0.55) return hslToHex(h, Math.min(1, s * 1.5 + 0.2), Math.max(0.1, l * 0.22))
  else return hslToHex(h, Math.max(0, s * 0.35), Math.min(0.96, l * 1.9 + 0.25))
}

function getTextColor(hex: string, mode: 'harmony' | 'contrast' | 'bw'): string {
  if (mode === 'harmony') return getHarmonyColor(hex)
  const lum = (0.299 * parseInt(hex.slice(1, 3), 16) + 0.587 * parseInt(hex.slice(3, 5), 16) + 0.114 * parseInt(hex.slice(5, 7), 16)) / 255
  if (mode === 'bw') return lum > 0.55 ? '#1a1a18' : '#ffffff'
  return lum > 0.55 ? '#1a1a18' : '#f8f8f5'
}

const Editor = dynamic(() => import('@/components/Editor'), { ssr: false })
const ColorPicker = dynamic(() => import('@/components/ColorPicker'), { ssr: false })
const TagInput = dynamic(() => import('@/components/TagInput'), { ssr: false })

const VIS_OPTIONS: { value: Visibility; label: string; desc: string; icon: React.ReactNode }[] = [
  { value: 'public', label: '公开', desc: '所有人可见', icon: <Eye size={13} /> },
  { value: 'private', label: '私密', desc: '只有你自己', icon: <Lock size={13} /> },
]

function WriteForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')

  const [authed, setAuthed] = useState<boolean | null>(null)
  const [password, setPassword] = useState('')
  const [pwError, setPwError] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [visibility, setVisibility] = useState<Visibility>('private')
  const [cardColor, setCardColor] = useState('#A8DADC')
  const [textMode, setTextMode] = useState<'harmony' | 'contrast' | 'bw'>('contrast')
  const [tags, setTags] = useState<string[]>([])
  const cardTextColor = getTextColor(cardColor, textMode)
  const [showVisMenu, setShowVisMenu] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'check' }) })
      .then(r => setAuthed(r.ok))
      .catch(() => setAuthed(false))

    fetch('/api/posts')
      .then(r => {
        if (editId) {
          return r.json().then((posts: any[]) => {
            const post = posts.find(p => p.id === editId)
            if (post) {
              setTitle(post.title || '')
              setContent(post.content || '')
              setVisibility(post.visibility)
              if (post.card_color) setCardColor(post.card_color)
              if (post.tags) setTags(post.tags)
            }
          })
        }
      })
  }, [editId])

  const login = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) { setAuthed(true) }
    else { setPwError(true); setTimeout(() => setPwError(false), 1500) }
  }

  const save = async () => {
    setSaving(true)
    const method = editId ? 'PATCH' : 'POST'
    const body = editId
      ? { id: editId, title, content, visibility, card_color: cardColor, card_text_color: cardTextColor, tags }
      : { title, content, visibility, card_color: cardColor, card_text_color: cardTextColor, tags }

    const res = await fetch('/api/posts', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      const post = await res.json()
      setSaving(false)
      setSaved(true)
      setTimeout(() => router.push(`/p/${post.slug}?new=1`), 600)
    } else {
      setSaving(false)
    }
  }

  const deletePost = async () => {
    if (!editId || !confirm('确定删除这篇吗？')) return
    await fetch('/api/posts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editId }),
    })
    router.push('/')
  }

  if (authed === false) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <form onSubmit={login} className="w-full max-w-[280px]">
          <div className="text-[10px] tracking-[0.15em] text-stone-400 font-sans mb-8 text-center">ZIXUANZHAO</div>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="密码"
            className={`w-full border-b ${pwError ? 'border-red-300' : 'border-stone-300'} bg-transparent text-[15px] font-serif text-stone-700 placeholder-stone-300 focus:outline-none focus:border-[#639922] py-2 text-center transition-colors`}
            autoFocus
          />
          {pwError && <p className="text-[12px] text-red-400 text-center mt-2 font-sans">密码不对</p>}
          <button type="submit" className="mt-6 w-full text-[13px] text-stone-400 hover:text-[#3B6D11] font-sans transition-colors">
            进入 →
          </button>
        </form>
      </div>
    )
  }

  if (authed === null) return null

  const currentVis = VIS_OPTIONS.find(v => v.value === visibility)!

  return (
    <main className="max-w-[860px] mx-auto px-6 md:px-16 pb-20">
      {/* Header */}
      <div className="flex justify-between items-center py-6 mb-2">
        <a href="/" className="text-[11px] tracking-[0.15em] text-stone-400 font-sans">← zixuanzhao</a>
        <div className="flex items-center gap-3">
          {editId && (
            <button onClick={deletePost} className="text-stone-300 hover:text-red-400 transition-colors">
              <Trash2 size={14} />
            </button>
          )}

          {/* Visibility selector */}
          <div className="relative">
            <button
              onClick={() => setShowVisMenu(!showVisMenu)}
              className="flex items-center gap-1.5 text-[12px] text-stone-500 font-sans hover:text-stone-700 transition-colors"
            >
              {currentVis.icon}
              <span>{currentVis.label}</span>
              <ChevronDown size={11} />
            </button>
            {showVisMenu && (
              <div className="absolute right-0 top-7 bg-white border border-stone-200 rounded-lg shadow-sm z-10 w-44 py-1 overflow-hidden">
                {VIS_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setVisibility(opt.value); setShowVisMenu(false) }}
                    className={`w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-stone-50 transition-colors ${visibility === opt.value ? 'text-[#3B6D11]' : 'text-stone-600'}`}
                  >
                    <span className="mt-0.5">{opt.icon}</span>
                    <div>
                      <div className="text-[12px] font-sans font-medium">{opt.label}</div>
                      <div className="text-[11px] text-stone-400 font-sans">{opt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={save}
            disabled={saving || saved}
            className={`text-[12px] px-4 py-1.5 rounded-full font-sans transition-all ${
              saved ? 'bg-[#EAF3DE] text-[#3B6D11]' : 'bg-[#3B6D11] text-[#EAF3DE] hover:bg-[#27500A]'
            } disabled:opacity-60`}
          >
            {saved ? '已发布 ✓' : saving ? '发布中…' : editId ? '保存' : '发布'}
          </button>
        </div>
      </div>

      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="标题（可以没有）"
        className="w-full text-[22px] font-serif text-stone-800 placeholder-stone-300 bg-transparent border-none focus:outline-none mb-4"
      />

      {/* Editor */}
      <Editor
        key={editId || 'new'}
        content={content}
        onChange={setContent}
        placeholder="从这里开始写…"
      />

      {/* Color + Tags */}
      <div className="mt-8 space-y-6">
        <div>
          <div className="text-[11px] text-stone-400 font-sans mb-3">卡片颜色</div>
          <ColorPicker value={cardColor} onChange={setCardColor} />
          <div className="mt-3 flex items-start gap-2">
            <span className="text-[11px] text-stone-400 font-sans mt-1.5">预览：</span>
            <div className="flex flex-col gap-2">
              <div
                className="px-3 py-1.5 rounded font-mono text-[12px]"
                style={{ background: cardColor, color: cardTextColor }}
              >
                {title || '文章标题'}
              </div>
              <div className="flex gap-1.5">
                {(['harmony', 'contrast', 'bw'] as const).map(m => {
                  const tc = getTextColor(cardColor, m)
                  const label = m === 'harmony' ? '同色系' : m === 'contrast' ? '高对比' : '纯白黑'
                  return (
                    <button
                      key={m}
                      onClick={() => setTextMode(m)}
                      title={label}
                      style={{ flex: 1, height: 32 }}
                      className={`flex items-center justify-center gap-1 text-[10px] font-mono px-2 rounded border transition-all ${
                        textMode === m
                          ? 'border-stone-500 bg-stone-100 text-stone-700'
                          : 'border-stone-200 text-stone-400 hover:border-stone-400'
                      }`}
                    >
                      <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: tc, border: '1px solid rgba(0,0,0,0.15)', flexShrink: 0 }} />
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="text-[11px] text-stone-400 font-sans mb-3">标签</div>
          <div className="border border-stone-200 rounded-lg px-3 py-2">
            <TagInput value={tags} onChange={setTags} />
          </div>
        </div>
      </div>

      <p className="mt-4 text-[11px] text-stone-400 font-sans text-right">
        写完点右上角「发布」，之后随时可以改
      </p>

    </main>
  )
}

export default function WritePage() {
  return (
    <Suspense>
      <WriteForm />
    </Suspense>
  )
}
