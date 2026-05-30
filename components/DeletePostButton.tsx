'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeletePostButton({ postId }: { postId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm('删除这篇？可以在回收站找回。')) return
    setLoading(true)
    await fetch('/api/posts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: postId }),
    })
    router.push('/')
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-[12px] text-stone-400 hover:text-red-400 font-sans transition-colors disabled:opacity-40"
    >
      {loading ? '删除中…' : '删除这篇'}
    </button>
  )
}
