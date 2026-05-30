import { supabase } from './supabase'

type EventType =
  | 'post_created'
  | 'post_updated'
  | 'post_deleted'
  | 'post_restored'
  | 'post_permanently_deleted'
  | 'post_viewed'
  | 'post_shared'
  | 'photo_uploaded'
  | 'photo_deleted'
  | 'photo_captioned'
  | 'photo_restored'
  | 'photo_permanently_deleted'
  | 'write_opened'

export async function log(event_type: EventType, payload: Record<string, unknown> = {}) {
  await supabase.from('activity_log').insert({ event_type, payload })
}
