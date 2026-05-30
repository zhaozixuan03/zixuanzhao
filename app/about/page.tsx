import Nav from '@/components/Nav'
import { isAuthenticated } from '@/lib/auth'

export default async function About() {
  const authed = await isAuthenticated()

  return (
    <main className="max-w-[860px] mx-auto px-6 md:px-16 pb-20">
      <Nav isAuthed={authed} />
      <article className="post-content max-w-[600px]">
        <p>
          zixuanzhao。马上毕业，要出发了。
        </p>
        <p>
          这里放我写的字和拍的照片。有些给所有人看，有些只给自己。
        </p>
        <p>
          前路浩荡，不祝一帆风顺——那太轻巧，也未必是我真正想要的。
          只愿能少一点内耗，多一点知行合一，拥有让自己幸福的能力，对自己满意。
        </p>
        <p className="text-stone-400">带着这些感恩，动身。</p>
      </article>
      {authed && (
        <div className="mt-16 pt-6 border-t border-stone-100 flex gap-6">
          <a href="/trash" style={{ fontSize: 12, color: '#aaa', fontFamily: 'monospace' }}>
            回收站
          </a>
          <a href="/api/export" download style={{ fontSize: 12, color: '#aaa', fontFamily: 'monospace' }}>
            导出我的所有数据 ↓
          </a>
        </div>
      )}
    </main>
  )
}
