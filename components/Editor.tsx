'use client'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import { useRef } from 'react'
import {
  Bold, Italic, Image as ImageIcon, Link as LinkIcon,
  Heading2, List, Quote, Minus
} from 'lucide-react'

interface Props {
  content?: string
  onChange: (html: string) => void
  placeholder?: string
}

export default function Editor({ content = '', onChange, placeholder = '写点什么…' }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder }),
      Link.configure({ openOnClick: false }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: { class: 'tiptap focus:outline-none' },
    },
  })

  if (!editor) return null

  const uploadImage = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const { url } = await res.json()
      editor.chain().focus().setImage({ src: url }).run()
    } catch (e) {
      alert('图片上传失败，请重试')
    }
  }

  const handleImageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadImage(file)
    e.target.value = ''
  }

  const setLink = () => {
    const url = window.prompt('链接地址')
    if (url) editor.chain().focus().setLink({ href: url }).run()
  }

  const btnClass = (active?: boolean) =>
    `p-1.5 rounded text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors ${active ? 'text-[#3B6D11] bg-[#EAF3DE]' : ''}`

  return (
    <div className="border border-stone-200 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-3 py-2 border-b border-stone-100 bg-stone-50 flex-wrap">
        <button onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive('bold'))}>
          <Bold size={14} />
        </button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive('italic'))}>
          <Italic size={14} />
        </button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnClass(editor.isActive('heading', { level: 2 }))}>
          <Heading2 size={14} />
        </button>
        <div className="w-px h-4 bg-stone-200 mx-1" />
        <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive('bulletList'))}>
          <List size={14} />
        </button>
        <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btnClass(editor.isActive('blockquote'))}>
          <Quote size={14} />
        </button>
        <button onClick={() => editor.chain().focus().setHorizontalRule().run()} className={btnClass()}>
          <Minus size={14} />
        </button>
        <div className="w-px h-4 bg-stone-200 mx-1" />
        <button onClick={setLink} className={btnClass(editor.isActive('link'))}>
          <LinkIcon size={14} />
        </button>
        <button onClick={() => fileInputRef.current?.click()} className={btnClass()}>
          <ImageIcon size={14} />
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageInput} />

        <div className="ml-auto text-[11px] text-stone-400 font-sans">
          {editor.storage?.characterCount?.words?.() ?? ''} 字
        </div>
      </div>

      {/* Editor area */}
      <div className="px-5 py-4 min-h-[280px] bg-white">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
