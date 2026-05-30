import { notFound } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import TrashClient from '@/components/TrashClient'

export const revalidate = 0

export default async function TrashPage() {
  const authed = await isAuthenticated()
  if (!authed) notFound()

  const [{ data: posts }, { data: photos }] = await Promise.all([
    supabase.from('posts').select('*').not('deleted_at', 'is', null).order('deleted_at', { ascending: false }),
    supabase.from('photos').select('*').not('deleted_at', 'is', null).order('deleted_at', { ascending: false }),
  ])

  return <TrashClient initialPosts={posts || []} initialPhotos={photos || []} />
}
