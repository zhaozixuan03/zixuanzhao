'use client'
import { useEffect } from 'react'

export default function ViewLogger({ postId, title }: { postId: string; title: string | null }) {
  useEffect(() => {
    fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: 'post_viewed', payload: { post_id: postId, title } }),
    })
  }, [])
  return null
}
