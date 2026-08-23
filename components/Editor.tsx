'use client';

import * as React from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, Image as ImageIcon, Heading1, Heading2, List, Quote, Code } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from './ui/cn';

// Tiptap 编辑器（中文友好的极简工具栏 + slash 风格的 Markdown 输入）
// 存储为 HTML；导出时由 export.ts 转回带图注的 Markdown。

export function Editor({
  html,
  onChange,
  placeholder = '从这里开始写——或者在左侧创作指令面板里点"生成"。',
  className,
}: {
  html: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Image.configure({ inline: false, allowBase64: true }),
      Placeholder.configure({ placeholder }),
    ],
    content: html || '',
    editorProps: {
      attributes: {
        class:
          'prose-app max-w-prose focus:outline-none min-h-[60vh] py-6 px-8 mx-auto',
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    immediatelyRender: false,
  });

  // 外部 html 变化时（如加载已存在文章）同步进 editor
  React.useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== html) {
      editor.commands.setContent(html || '', false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html]);

  const insertImage = React.useCallback(() => {
    const url = window.prompt('图片 URL（或 data:image/...）：');
    if (!url) return;
    editor?.chain().focus().setImage({ src: url, alt: '图片' }).run();
  }, [editor]);

  if (!editor) {
    return <div className={cn('text-ink-muted text-sm p-8', className)}>加载编辑器…</div>;
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="sticky top-0 z-10 border-b border-ink-line bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-prose flex items-center gap-1 px-4 py-2">
          <ToolbarBtn on={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} aria-label="H1"><Heading1 size={14}/></ToolbarBtn>
          <ToolbarBtn on={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} aria-label="H2"><Heading2 size={14}/></ToolbarBtn>
          <Sep/>
          <ToolbarBtn on={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} aria-label="加粗"><Bold size={14}/></ToolbarBtn>
          <ToolbarBtn on={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} aria-label="斜体"><Italic size={14}/></ToolbarBtn>
          <ToolbarBtn on={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} aria-label="引用"><Quote size={14}/></ToolbarBtn>
          <ToolbarBtn on={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} aria-label="列表"><List size={14}/></ToolbarBtn>
          <ToolbarBtn on={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()} aria-label="代码"><Code size={14}/></ToolbarBtn>
          <Sep/>
          <ToolbarBtn onClick={insertImage} aria-label="插入图片"><ImageIcon size={14}/></ToolbarBtn>
          <div className="ml-auto text-xs text-ink-muted">{editor.storage.characterCount?.characters?.() ?? ''}</div>
        </div>
      </div>
      <EditorContent editor={editor} className="flex-1 overflow-y-auto" />
    </div>
  );
}

function ToolbarBtn({ on, onClick, children, ...rest }: { on: boolean; onClick: () => void; children: React.ReactNode; [k: string]: unknown }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'h-7 w-7 inline-flex items-center justify-center rounded text-ink-soft hover:bg-ink-panel',
        on && 'bg-ink-panel text-ink',
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
function Sep() { return <span className="mx-1 h-4 w-px bg-ink-line" />; }
