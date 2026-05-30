'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Nav({ isAuthed }: { isAuthed?: boolean }) {
  const path = usePathname()

  return (
    <nav className="flex justify-between items-center py-8 mb-2 border-b border-stone-100">
      <Link href="/" className="text-[12px] md:text-[13px] font-sans transition-colors" style={{ color: '#999' }}>
        赵子萱
      </Link>
      <div className="flex gap-7">
        <Link
          href="/"
          className={`text-[12px] md:text-[13px] font-sans transition-colors ${path === '/' ? 'text-[#3B6D11]' : 'text-stone-400 hover:text-stone-800'}`}
        >
          文字
        </Link>
        <Link
          href="/photos"
          className={`text-[12px] md:text-[13px] font-sans transition-colors ${path === '/photos' ? 'text-[#3B6D11]' : 'text-stone-400 hover:text-stone-800'}`}
        >
          影像
        </Link>
        <Link
          href="/about"
          className={`text-[12px] md:text-[13px] font-sans transition-colors ${path === '/about' ? 'text-[#3B6D11]' : 'text-stone-400 hover:text-stone-800'}`}
        >
          关于
        </Link>
        <Link
          href="/search"
          className={`text-[12px] md:text-[13px] font-sans transition-colors ${path === '/search' ? 'text-[#3B6D11]' : 'text-stone-400 hover:text-stone-800'}`}
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
        {isAuthed && (
          <Link
            href="/trash"
            className={`text-[12px] md:text-[13px] font-mono transition-colors ${path === '/trash' ? 'text-[#3B6D11]' : 'text-stone-300 hover:text-stone-500'}`}
          >
            回收站
          </Link>
        )}
      </div>
    </nav>
  )
}
