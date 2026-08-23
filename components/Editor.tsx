'use client';

import * as React from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { Bold, Italic, Image as ImageIcon, Heading1, Heading2, List, Quote, Code } from 'lucide-react';
import { cn } from './ui/cn';

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
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Image.configure({ inline: false, allowBase64: true }),
      Placeholder.configure({ placeholder }),
      CharacterCount.configure({}),
    ],
    content: html || '',
    editorProps: {
      attributes: {
        class: 'prose-app max-w-prose focus:outline-none min-h-[60vh] py-6 px-8 mx-auto',
      },
      handlePaste(view, event) {
        const items = Array.from(event.clipboardData?.items ?? []);
        const imageItem = items.find((it) => it.type.startsWith('image/'));
        if (!imageItem) return false;
        const file = imageItem.getAsFile();
        if (!file) return false;
        const url = URL.createObjectURL(file);
        const caption = window.prompt('图注（可选，符合"图 N｜描述。图片来源：…"格式更佳）：') ?? '';
        const alt = caption || '图片';
        const { state, dispatch } = view;
        const node = state.schema.nodes.image.create({ src: url, alt });
        dispatch(state.tr.replaceSelectionWith(node));
        if (caption) {
          dispatch(state.tr.insertText(`\n${caption}\n`));
        }
        return true;
      },
      handleDrop(view, event) {
        const file = event.dataTransfer?.files?.[0];
        if (!file || !file.type.startsWith('image/')) return false;
        event.preventDefault();
        const url = URL.createObjectURL(file);
        const caption = window.prompt('图注（可选）：') ?? '';
        const { state, dispatch } = view;
        const node = state.schema.nodes.image.create({ src: url, alt: caption || '图片' });
        const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
        const pos = coords?.pos ?? state.selection.from;
        dispatch(state.tr.insert(pos, node));
        return true;
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    immediatelyRender: false,
  });

  React.useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== html) editor.commands.setContent(html || '', false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html]);

  const insertImage = React.useCallback(() => {
    const choice = window.prompt('图片方式：(1) 粘贴 URL/dataURL；(2) 上传本地文件生成临时 URL\n\n直接输入 URL 或 dataURL，或输入 "upload" 上传本地文件：');
    if (!choice) return;
    if (choice.trim().toLowerCase() === 'upload') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = () => {
        const f = input.files?.[0];
        if (!f) return;
        const url = URL.createObjectURL(f);
        const caption = window.prompt('图注：') ?? '';
        editor?.chain().focus().setImage({ src: url, alt: caption || '图片' }).run();
        if (caption) editor?.chain().focus().insertContent(`\n${caption}\n`).run();
      };
      input.click();
      return;
    }
    const caption = window.prompt('图注：') ?? '';
    editor?.chain().focus().setImage({ src: choice, alt: caption || '图片' }).run();
    if (caption) editor?.chain().focus().insertContent(`\n${caption}\n`).run();
  }, [editor]);

  if (!editor) return <div className={cn('text-ink-muted text-sm p-8', className)}>加载编辑器…</div>;

  const chars = editor.storage.characterCount?.characters?.() ?? 0;
  const words = editor.storage.characterCount?.words?.() ?? 0;

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
          <div className="ml-auto text-[11px] text-ink-muted tabular-nums">{words} 词 · {chars} 字</div>
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
