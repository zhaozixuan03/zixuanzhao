'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Nav({ isAuthed }: { isAuthed?: boolean }) {
  const path = usePathname()

  return (
    <nav className="flex justify-between items-center py-8 mb-2">
      <Link href="/" className="text-[11px] tracking-[0.18em] text-stone-400 hover:text-[#3B6D11] transition-colors font-sans uppercase">
        zixuanzhao
      </Link>
      <div className="flex gap-7">
        <Link
          href="/"
          className={`text-[12px] font-sans transition-colors ${path === '/' ? 'text-[#3B6D11]' : 'text-stone-400 hover:text-stone-700'}`}
        >
          文字
        </Link>
        <button
          onClick={() => document.getElementById('photos-section')?.scrollIntoView({ behavior: 'smooth' })}
          className="text-[12px] font-sans text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
        >
          影像
        </button>
        <Link
          href="/about"
          className={`text-[12px] font-sans transition-colors ${path === '/about' ? 'text-[#3B6D11]' : 'text-stone-400 hover:text-stone-700'}`}
        >
          关于
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
