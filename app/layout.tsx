import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'zixuanzhao',
  description: '有时候，真正的抵达，藏在出发之前。',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body className="min-h-screen bg-[#fafaf8]">
        {children}
      </body>
    </html>
  )
}
