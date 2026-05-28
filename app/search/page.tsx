'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Post } from '@/lib/supabase'
import PostCard from '@/components/PostCard'
import Nav from '@/components/Nav'

export default function SearchPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'check' }),
    })
      .then(r => setAuthed(r.ok))
      .catch(() => setAuthed(false))
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') router.push('/')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [router])

  useEffect(() => {
    const q = query.trim()
    if (!q) { setResults([]); setSearched(false); return }

    const timer = setTimeout(async () => {
      setLoading(true)
      let req = supabase
        .from('posts')
        .select('*')
        .or(`title.ilike.%${q}%,content_text.ilike.%${q}%`)
        .order('created_at', { ascending: false })

      if (!authed) {
        req = req.in('visibility', ['public'])
      }

      const { data } = await req
      setResults((data as Post[]) || [])
      setSearched(true)
      setLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [query, authed])

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-[860px] mx-auto px-6 md:px-16">
        <Nav isAuthed={authed} />
      </div>

      <div className="max-w-[860px] mx-auto px-6 md:px-16 pt-6">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="搜索我写过的字…"
          autoFocus
          className="w-full bg-transparent border-none focus:outline-none"
          style={{ fontFamily: "'Noto Serif SC', Georgia, serif", fontSize: 22, color: '#555' }}
        />
        <div className="border-b border-stone-200 mt-3 mb-8" />

        {loading && (
          <p className="font-mono text-[12px]" style={{ color: '#ccc' }}>搜索中…</p>
        )}

        {!loading && searched && results.length === 0 && (
          <p className="py-16 text-center" style={{ fontFamily: "'Noto Serif SC', Georgia, serif", fontSize: 14, color: '#888' }}>
            没有找到关于「{query}」的字
          </p>
        )}

        {!loading && results.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-[2px]">
            {results.map(post => (
              <PostCard key={post.id} post={post} isOwner={authed} />
            ))}
          </div>
        )}

        {!searched && !loading && (
          <p className="font-mono text-center pt-16" style={{ fontSize: 11, color: '#ccc' }}>
            按 ESC 返回首页
          </p>
        )}
      </div>
    </div>
  )
}
