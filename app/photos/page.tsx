import { supabase } from '@/lib/supabase'
import { isAuthenticated } from '@/lib/auth'
import PhotosPage from '@/components/PhotosPage'

export const revalidate = 0

export default async function Photos() {
  const authed = await isAuthenticated()
  const { data: photos } = await supabase
    .from('photos')
    .select('*')
    .is('post_id', null)
    .order('created_at', { ascending: false })

  return <PhotosPage photos={photos || []} isOwner={authed} />
}
