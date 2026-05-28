import { Post } from './supabase'

export function generateSlug(title: string | null, id: string): string {
  if (!title) return id.slice(0, 8)
  return title
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 60) + '-' + id.slice(0, 6)
}

export function extractPlainText(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function extractImages(html: string): string[] {
  const matches = html.match(/<img[^>]+src="([^"]+)"/g) || []
  return matches.map(m => {
    const src = m.match(/src="([^"]+)"/)
    return src ? src[1] : ''
  }).filter(Boolean)
}

export function getExcerpt(text: string, length = 80): string {
  return text.length > length ? text.slice(0, length) + '…' : text
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${month}-${day}`
}

export function formatDateFull(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()} · ${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function countWords(text: string): number {
  // CJK characters count as 1 word each, western words count normally
  const cjk = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  const western = (text.match(/[a-zA-Z]+/g) || []).length
  return cjk + western
}

export function isOwner(isAuthed: boolean, visibility: Post['visibility']): boolean {
  return isAuthed
}

export function cardTextColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.55 ? '#1a1a18' : '#f8f8f5'
}
