'use client'

import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import { useRef, useState } from 'react'
import {
  Bold, Image as ImageIcon, Italic, Link as LinkIcon, List,
  ListOrdered, Quote, Redo2, RemoveFormatting, SeparatorHorizontal,
  Undo2
} from 'lucide-react'

interface Props {
  content?: string
  onChange: (html: string) => void
  placeholder?: string
}

type SlashAction = {
  label: string
  hint: string
}

const SLASH_ACTIONS: SlashAction[] = [
  { label: '正文', hint: '普通文字段落' },
  { label: '一级标题', hint: '也可输入 # 加空格' },
  { label: '二级标题', hint: '也可输入 ## 加空格' },
  { label: '无序列表', hint: '也可输入 - 加空格' },
  { label: '有序列表', hint: '也可输入 1. 加空格' },
  { label: '引用', hint: '记录值得留下的话' },
  { label: '分隔线', hint: '把两段心绪隔开' },
  { label: '图片', hint: '也可直接拖入或粘贴' },
]

export default function Editor({ content = '', onChange, placeholder = '写点什么…' }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [slashOpen, setSlashOpen] = useState(false)
  const [slashQuery, setSlashQuery] = useState('')
  const [bubblePosition, setBubblePosition] = useState<{ left: number; top: number } | null>(null)

  async function uploadImage(file: File) {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const { url } = await res.json()
      if (!url) throw new Error('missing upload URL')
      editor?.chain().focus().setImage({ src: url }).run()
    } catch {
      alert('图片上传失败，请重试')
    }
  }

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

      const { from } = editor.state.selection
      const beforeCursor = editor.state.doc.textBetween(Math.max(0, from - 40), from, '\n', '\0')
      const match = beforeCursor.match(/(?:^|\s)\/([^\s]*)$/)
      setSlashOpen(Boolean(match))
      setSlashQuery(match?.[1] || '')
    },
    onSelectionUpdate: ({ editor }) => {
      if (editor.state.selection.empty) {
        setBubblePosition(null)
        return
      }
      const canvas = canvasRef.current
      if (!canvas) return
      const coords = editor.view.coordsAtPos(editor.state.selection.from)
      const rect = canvas.getBoundingClientRect()
      setBubblePosition({ left: coords.left - rect.left, top: coords.top - rect.top - 42 })
    },
    editorProps: {
      attributes: { class: 'tiptap document-canvas focus:outline-none' },
      handlePaste: (_view, event) => {
        const image = Array.from(event.clipboardData?.files || []).find(file => file.type.startsWith('image/'))
        if (!image) return false
        event.preventDefault()
        void uploadImage(image)
        return true
      },
      handleDrop: (_view, event) => {
        const image = Array.from(event.dataTransfer?.files || []).find(file => file.type.startsWith('image/'))
        if (!image) return false
        event.preventDefault()
        void uploadImage(image)
        return true
      },
      handleKeyDown: (_view, event) => {
        if (event.key === 'Escape' && slashOpen) {
          setSlashOpen(false)
          return true
        }
        return false
      },
    },
  })

  const removeSlash = () => {
    if (!editor) return
    const { from } = editor.state.selection
    const beforeCursor = editor.state.doc.textBetween(Math.max(0, from - 40), from, '\n', '\0')
    const match = beforeCursor.match(/(?:^|\s)\/([^\s]*)$/)
    if (match) editor.chain().focus().deleteRange({ from: from - match[0].length + (match[0].startsWith(' ') ? 1 : 0), to: from }).run()
    setSlashOpen(false)
  }

  const setLink = () => {
    const url = window.prompt('链接地址')
    if (url) editor?.chain().focus().setLink({ href: url }).run()
  }

  if (!editor) return null

  const runSlashAction = (label: string) => {
    removeSlash()
    if (label === '正文') editor.chain().focus().setParagraph().run()
    if (label === '一级标题') editor.chain().focus().toggleHeading({ level: 1 }).run()
    if (label === '二级标题') editor.chain().focus().toggleHeading({ level: 2 }).run()
    if (label === '无序列表') editor.chain().focus().toggleBulletList().run()
    if (label === '有序列表') editor.chain().focus().toggleOrderedList().run()
    if (label === '引用') editor.chain().focus().toggleBlockquote().run()
    if (label === '分隔线') editor.chain().focus().setHorizontalRule().run()
    if (label === '图片') fileInputRef.current?.click()
  }

  const filteredActions = SLASH_ACTIONS.filter(action => action.label.includes(slashQuery))

  return (
    <div className="document-editor">
      <div className="document-editor-area" ref={canvasRef}>
        <button
          type="button"
          className="document-add-button"
          onClick={() => { setSlashQuery(''); setSlashOpen(!slashOpen); editor.chain().focus().run() }}
          aria-label="插入内容"
        >
          +
        </button>

        {bubblePosition && (
          <div className="document-bubble-menu" style={{ left: bubblePosition.left, top: bubblePosition.top }}>
          <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'active' : ''}><Bold size={14} /></button>
          <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'active' : ''}><Italic size={14} /></button>
          <button type="button" onClick={setLink} className={editor.isActive('link') ? 'active' : ''}><LinkIcon size={14} /></button>
          <button type="button" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}><RemoveFormatting size={14} /></button>
          </div>
        )}

        <div className="document-scroll-area">
          <EditorContent editor={editor} />
        </div>

        {slashOpen && (
          <div className="document-slash-menu" role="menu" aria-label="插入内容">
            <div className="document-slash-menu-title">插入内容</div>
            {filteredActions.length > 0 ? filteredActions.map(action => (
              <button key={action.label} type="button" onClick={() => runSlashAction(action.label)} role="menuitem">
                <span>{action.label}</span>
                <small>{action.hint}</small>
              </button>
            )) : <div className="document-slash-empty">没有匹配的内容类型</div>}
          </div>
        )}
      </div>

      <div className="document-editor-footer">
        <div className="document-quick-actions" aria-label="编辑操作">
          <button type="button" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} aria-label="撤销"><Undo2 size={15} /></button>
          <button type="button" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} aria-label="重做"><Redo2 size={15} /></button>
          <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive('heading', { level: 1 }) ? 'active' : ''}>H1</button>
          <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'active' : ''}>H2</button>
          <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'active' : ''} aria-label="无序列表"><List size={15} /></button>
          <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'active' : ''} aria-label="有序列表"><ListOrdered size={15} /></button>
          <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={editor.isActive('blockquote') ? 'active' : ''} aria-label="引用"><Quote size={15} /></button>
          <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} aria-label="分隔线"><SeparatorHorizontal size={15} /></button>
          <button type="button" onClick={setLink} className={editor.isActive('link') ? 'active' : ''} aria-label="链接"><LinkIcon size={15} /></button>
          <button type="button" onClick={() => fileInputRef.current?.click()} aria-label="图片"><ImageIcon size={15} /></button>
        </div>
        <span>{editor.getText().trim().length} 字</span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={event => {
          const file = event.target.files?.[0]
          if (file) void uploadImage(file)
          event.target.value = ''
        }}
      />
    </div>
  )
}
