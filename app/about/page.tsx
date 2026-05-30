import Nav from '@/components/Nav'
import { isAuthenticated } from '@/lib/auth'

export default async function About() {
  const authed = await isAuthenticated()

  return (
    <main className="max-w-[860px] mx-auto px-6 md:px-16 pb-20">
      <Nav isAuthed={authed} />
      <article className="max-w-[600px]">
        {[
          '你为什么来这里？',
          '我也不太确定我为什么在这里。\n但我们都来了。',
          '很高兴认识你 💚',
        ].map((text, i) => (
          <p key={i} style={{ fontFamily: "'Noto Serif SC', Georgia, serif", fontSize: 17, lineHeight: 2, color: '#555', marginBottom: 24, whiteSpace: 'pre-line' }}>
            {text}
          </p>
        ))}
      </article>
      {authed && (
        <div className="mt-16 pt-6 border-t border-stone-100">
          <a href="/api/export" download style={{ fontSize: 12, color: '#aaa', fontFamily: 'monospace' }}>
            导出我的所有数据 ↓
          </a>
        </div>
      )}
    </main>
  )
}
