export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
  const month = now.getMonth() === 0 ? 12 : now.getMonth()
  const monthStr = `${year}-${String(month).padStart(2, '0')}`
  const startDate = `${year}-${String(month).padStart(2, '0')}-01T00:00:00.000Z`
  const endDate = new Date(year, month, 1).toISOString()

  const [{ data: posts }, { data: photos }, { data: logs }] = await Promise.all([
    supabase.from('posts').select('*').gte('created_at', startDate).lt('created_at', endDate).is('deleted_at', null),
    supabase.from('photos').select('*').gte('created_at', startDate).lt('created_at', endDate).is('deleted_at', null),
    supabase.from('activity_log').select('*').gte('created_at', startDate).lt('created_at', endDate),
  ])

  const tagCount: Record<string, number> = {}
  posts?.forEach(p => {
    ;(p.tags || []).forEach((tag: string) => {
      tagCount[tag] = (tagCount[tag] || 0) + 1
    })
  })
  const tagsSorted = Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) => `${tag}×${count}`)

  const totalWords = posts?.reduce((sum, p) => sum + (p.content_text?.length || 0), 0) || 0

  const writingSessions = logs?.filter(l => l.event_type === 'post_created' || l.event_type === 'post_updated') || []
  const totalWritingSeconds = writingSessions.reduce((sum, l) => sum + (l.payload?.writing_seconds || 0), 0)

  const dayCount: Record<string, number> = {}
  posts?.forEach(p => {
    const day = p.created_at.slice(0, 10)
    dayCount[day] = (dayCount[day] || 0) + 1
  })
  const mostActiveDay = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null

  const summary = {
    month: monthStr,
    posts_count: posts?.length || 0,
    words_total: totalWords,
    tags: tagsSorted,
    photos_count: photos?.length || 0,
    most_active_day: mostActiveDay,
    writing_sessions: writingSessions.length,
    total_writing_minutes: Math.round(totalWritingSeconds / 60),
    posts: posts?.map(p => ({
      title: p.title,
      slug: p.slug,
      word_count: p.content_text?.length || 0,
      tags: p.tags,
      visibility: p.visibility,
      created_at: p.created_at,
    })),
    photos: photos?.map(p => ({
      url: p.url,
      caption: p.caption,
      created_at: p.created_at,
    })),
  }

  await supabase.from('monthly_summary').upsert({ month: monthStr, data: summary })

  const [{ data: allPosts }, { data: allPhotos }, { data: allLogs }] = await Promise.all([
    supabase.from('posts').select('*').order('created_at', { ascending: false }),
    supabase.from('photos').select('*').order('created_at', { ascending: false }),
    supabase.from('activity_log').select('*').order('created_at', { ascending: false }),
  ])

  const exportData = JSON.stringify(
    { exported_at: new Date().toISOString(), posts: allPosts || [], photos: allPhotos || [], activity_log: allLogs || [] },
    null, 2
  )

  const emailHtml = `
    <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#1a1a18;padding:40px 20px;">
      <h1 style="font-size:24px;font-weight:400;margin-bottom:8px;">${year}年${month}月 · 月度摘要</h1>
      <p style="font-size:13px;color:#aaa;font-family:monospace;margin-bottom:32px;">zorazhao.com</p>

      <div style="background:#f5f4f0;padding:20px;border-radius:8px;margin-bottom:32px;">
        <div style="font-size:32px;color:#3B6D11;">${summary.posts_count}</div>
        <div style="font-size:13px;color:#888;margin-top:4px;">这个月种下了 ${summary.posts_count} 次</div>
      </div>

      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:32px;">
        <tr style="border-bottom:1px solid #e8e6e0;">
          <td style="padding:10px 0;color:#888;">总字数</td>
          <td style="padding:10px 0;text-align:right;font-family:monospace;">${summary.words_total.toLocaleString()} 字</td>
        </tr>
        <tr style="border-bottom:1px solid #e8e6e0;">
          <td style="padding:10px 0;color:#888;">写作时长</td>
          <td style="padding:10px 0;text-align:right;font-family:monospace;">${summary.total_writing_minutes} 分钟</td>
        </tr>
        <tr style="border-bottom:1px solid #e8e6e0;">
          <td style="padding:10px 0;color:#888;">上传照片</td>
          <td style="padding:10px 0;text-align:right;font-family:monospace;">${summary.photos_count} 张</td>
        </tr>
        <tr style="border-bottom:1px solid #e8e6e0;">
          <td style="padding:10px 0;color:#888;">常写主题</td>
          <td style="padding:10px 0;text-align:right;font-family:monospace;">${summary.tags.join(' · ') || '—'}</td>
        </tr>
        ${summary.most_active_day ? `<tr><td style="padding:10px 0;color:#888;">最活跃的一天</td><td style="padding:10px 0;text-align:right;font-family:monospace;">${summary.most_active_day}</td></tr>` : ''}
      </table>

      ${(summary.posts?.length || 0) > 0 ? `
      <h2 style="font-size:14px;font-weight:400;color:#888;margin-bottom:16px;letter-spacing:0.1em;">这个月写了</h2>
      ${summary.posts?.map(p => `
        <div style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #f0ede6;">
          <a href="https://zorazhao.com/p/${p.slug}" style="font-size:15px;color:#1a1a18;text-decoration:none;">${p.title || '无标题'}</a>
          <span style="font-size:12px;color:#aaa;font-family:monospace;margin-left:8px;">${p.word_count} 字</span>
        </div>
      `).join('')}` : ''}

      <p style="font-size:12px;color:#bbb;font-family:monospace;margin-top:40px;border-top:1px solid #e8e6e0;padding-top:20px;">
        完整数据备份见附件 · zorazhao.com
      </p>
    </div>
  `

  await resend.emails.send({
    from: 'noreply@zorazhao.com',
    to: ['2019358720@qq.com', 'zhao-zx21@mails.tsinghua.edu.cn', 'zhaozixuan.thu@gmail.com'],
    subject: `${year}年${month}月 · zorazhao 月度摘要`,
    html: emailHtml,
    attachments: [
      {
        filename: `zorazhao-${monthStr}.json`,
        content: Buffer.from(exportData).toString('base64'),
      },
    ],
  })

  return NextResponse.json({ ok: true, month: monthStr, summary })
}
