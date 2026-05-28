'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Nav({ isAuthed }: { isAuthed?: boolean }) {
  const path = usePathname()

  return (
    <nav className="flex justify-between items-center py-8 mb-2 border-b border-stone-100">
      <Link href="/" className="font-serif text-[13px] tracking-[0.08em] text-stone-600 hover:text-stone-800 transition-colors">
        zixuanzhao
      </Link>
      <div className="flex gap-7">
        <Link
          href="/"
          className={`text-[12px] font-sans transition-colors ${path === '/' ? 'text-[#3B6D11]' : 'text-stone-400 hover:text-stone-800'}`}
        >
          文字
        </Link>
        <button
          onClick={() => document.getElementById('photos-section')?.scrollIntoView({ behavior: 'smooth' })}
          className="text-[12px] font-sans text-stone-400 hover:text-stone-800 transition-colors cursor-pointer"
        >
          影像
        </button>
        <Link
          href="/about"
          className={`text-[12px] font-sans transition-colors ${path === '/about' ? 'text-[#3B6D11]' : 'text-stone-400 hover:text-stone-800'}`}
        >
          关于
        </Link>
        <Link
          href="/search"
          className={`text-[12px] font-sans transition-colors ${path === '/search' ? 'text-[#3B6D11]' : 'text-stone-400 hover:text-stone-800'}`}
        >
          搜索
        </Link>
        {isAuthed && (
          <Link
            href="/write"
            className="text-[12px] font-sans text-[#639922] hover:text-[#3B6D11] transition-colors"
          >
            写 +
          </Link>
        )}
      </div>
    </nav>
  )
}
