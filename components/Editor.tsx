'use client';

import * as React from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import {
  Bold, Italic, Image as ImageIcon, Heading1, Heading2, List, Quote, Code, Upload,
} from 'lucide-react';
import { cn } from './ui/cn';
import { Modal } from './ui/modal';
import { Button } from './ui/button';

interface PendingImage {
  source: string;          // 已确定的图片源（object URL / dataURL / 网络 URL）
  revokeOnCancel?: string; // 取消时需 revoke 的 object URL
  pos?: number;            // 拖拽插入位置（可选）
}

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
  // 图注对话框状态：替代原生 window.prompt，带预览与取消。
  const [pending, setPending] = React.useState<PendingImage | null>(null);
  const [caption, setCaption] = React.useState('');
  const [urlInput, setUrlInput] = React.useState('');
  const fileRef = React.useRef<HTMLInputElement>(null);
  // 记录编辑器自身发出的 html，供外部写入对比，避免冗余 setContent 清空撤销栈。
  const lastEmitted = React.useRef<string | null>(null);

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
        class: 'prose-app max-w-prose focus:outline-none min-h-[60vh] py-6 px-4 sm:px-8 mx-auto',
      },
      handlePaste(view, event) {
        const items = Array.from(event.clipboardData?.items ?? []);
        const imageItem = items.find((it) => it.type.startsWith('image/'));
        if (!imageItem) return false;
        const file = imageItem.getAsFile();
        if (!file) return false;
        const url = URL.createObjectURL(file);
        openImagePrompt({ source: url, revokeOnCancel: url });
        return true; // 消费该粘贴，交由对话框决定是否插入
      },
      handleDrop(view, event) {
        const file = event.dataTransfer?.files?.[0];
        if (!file || !file.type.startsWith('image/')) return false;
        event.preventDefault();
        const url = URL.createObjectURL(file);
        const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
        openImagePrompt({ source: url, revokeOnCancel: url, pos: coords?.pos });
        return true;
      },
    },
    onUpdate: ({ editor }) => {
      const h = editor.getHTML();
      lastEmitted.current = h;
      onChange(h);
    },
    immediatelyRender: false,
  });

  // 外部写入（切文章 / AI 生成）才替换；编辑器自己回涌的 html 不做 setContent。
  React.useEffect(() => {
    if (!editor) return;
    if (lastEmitted.current !== html) {
      lastEmitted.current = html || '';
      editor.commands.setContent(html || '', false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html]);

  const openImagePrompt = (p?: PendingImage) => {
    setCaption('');
    setUrlInput(p?.source ?? '');
    setPending(p ?? { source: '' });
  };

  const closeImagePrompt = () => {
    if (pending?.revokeOnCancel) URL.revokeObjectURL(pending.revokeOnCancel);
    setPending(null);
  };

  const insertImage = (source: string) => {
    if (!editor) return;
    if (pending?.pos != null) {
      editor.commands.setTextSelection({ from: pending.pos, to: pending.pos });
    }
    editor.chain().focus().setImage({ src: source, alt: caption || '图片' }).run();
    if (caption.trim()) editor.chain().focus().insertContent(`\n${caption.trim()}\n`).run();
  };

  const confirmInsert = () => {
    if (!pending) return;
    // 尚未确定来源时（点工具栏走空对话框）：用 URL 输入或已选文件
    const source = pending.source || urlInput.trim();
    if (!source) return;
    insertImage(source);
    if (pending.revokeOnCancel) URL.revokeObjectURL(pending.revokeOnCancel);
    setPending(null);
  };

  const onPickFile = (f: File | null) => {
    if (!f) return;
    setPending((prev) => {
      if (prev?.revokeOnCancel) URL.revokeObjectURL(prev.revokeOnCancel);
      return { source: URL.createObjectURL(f), revokeOnCancel: undefined };
    });
  };

  const toolbarButton = (label: string) => (
    <button
      onClick={() => openImagePrompt()}
      className="flex h-8 w-8 items-center justify-center rounded-md text-ink-soft hover:bg-ink-panel hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
      aria-label={label}
      title={label}
    >
      <ImageIcon size={14} />
    </button>
  );

  if (!editor) return <div className={cn('text-ink-muted text-sm p-8', className)}>加载编辑器…</div>;

  const chars = editor.storage.characterCount?.characters?.() ?? 0;
  const words = editor.storage.characterCount?.words?.() ?? 0;
  const hasSource = !!pending?.source || !!urlInput.trim();

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="sticky top-0 z-10 border-b border-ink-line bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-prose flex items-center gap-1 overflow-x-auto px-4 py-2 whitespace-nowrap">
          <ToolbarBtn on={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} aria-label="标题 1（H1）" aria-pressed={editor.isActive('heading', { level: 1 })}><Heading1 size={14} /></ToolbarBtn>
          <ToolbarBtn on={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} aria-label="标题 2（H2）" aria-pressed={editor.isActive('heading', { level: 2 })}><Heading2 size={14} /></ToolbarBtn>
          <Sep />
          <ToolbarBtn on={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} aria-label="加粗" aria-pressed={editor.isActive('bold')}><Bold size={14} /></ToolbarBtn>
          <ToolbarBtn on={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} aria-label="斜体" aria-pressed={editor.isActive('italic')}><Italic size={14} /></ToolbarBtn>
          <ToolbarBtn on={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} aria-label="引用" aria-pressed={editor.isActive('blockquote')}><Quote size={14} /></ToolbarBtn>
          <ToolbarBtn on={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} aria-label="列表" aria-pressed={editor.isActive('bulletList')}><List size={14} /></ToolbarBtn>
          <ToolbarBtn on={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()} aria-label="代码" aria-pressed={editor.isActive('code')}><Code size={14} /></ToolbarBtn>
          <Sep />
          {toolbarButton('插入图片')}
          <div className="ml-auto shrink-0 pl-3 text-[11px] text-ink-muted tabular-nums">{words} 词 · {chars} 字</div>
        </div>
      </div>
      <EditorContent editor={editor} className="flex-1 overflow-y-auto" />

      {/* 图注对话框 */}
      <Modal
        open={!!pending}
        onClose={closeImagePrompt}
        title="插入图片"
        width="max-w-md"
        footer={
          <>
            <Button variant="outline" onClick={closeImagePrompt}>取消</Button>
            <Button onClick={confirmInsert} disabled={!hasSource}>插入图片</Button>
          </>
        }
      >
        {pending?.source ? (
          <div className="mb-3">
            <img src={pending.source} alt="图片预览" className="max-h-48 w-full rounded-md border border-ink-line object-contain bg-ink-panel" />
          </div>
        ) : (
          <div className="mb-3 space-y-2 text-sm text-ink-muted">
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center justify-center gap-2 w-full rounded-md border border-dashed border-ink-line bg-ink-panel/40 py-4 text-ink-soft hover:border-ink"
            >
              <Upload size={15} /> 选择本地图片
            </button>
            <div className="flex items-center gap-2">
              <input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="或粘贴图片 URL / dataURL…"
                className="flex h-9 w-full rounded-md border border-ink-line bg-white px-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
              />
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onPickFile(e.target.files?.[0] ?? null)} />
          </div>
        )}
        <label className="block text-xs font-medium text-ink-soft mb-1.5">
          图注 <span className="text-ink-muted-weak font-normal">（格式：图 N｜描述。图片来源：…）</span>
        </label>
        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="图 01｜描述。图片来源：…"
          onKeyDown={(e) => { if (e.key === 'Enter') confirmInsert(); }}
          className="flex h-9 w-full rounded-md border border-ink-line bg-white px-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
        />
      </Modal>
    </div>
  );
}

function ToolbarBtn({ on, onClick, children, ...rest }: { on?: boolean; onClick: () => void; children: React.ReactNode; [k: string]: unknown }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'h-8 w-8 inline-flex items-center justify-center rounded-md text-ink-soft hover:bg-ink-panel',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink',
        on && 'bg-ink-panel text-ink',
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
function Sep() { return <span className="mx-1 h-4 w-px shrink-0 bg-ink-line" />; }