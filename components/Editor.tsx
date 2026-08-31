'use client';

import * as React from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import type { EditorView } from '@tiptap/pm/view';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { Bold, Italic, Image as ImageIcon, Heading1, Heading2, List, Quote, Code, Images } from 'lucide-react';
import { cn } from './ui/cn';
import { downscaleImage, blobToDataUrl } from '@/src/lib/images';

const EvidenceImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      sourceUrl: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-source-url'),
        renderHTML: (attributes) => attributes.sourceUrl ? { 'data-source-url': attributes.sourceUrl } : {},
      },
      sourceLabel: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-source-label'),
        renderHTML: (attributes) => attributes.sourceLabel ? { 'data-source-label': attributes.sourceLabel } : {},
      },
      imageLicense: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-image-license'),
        renderHTML: (attributes) => attributes.imageLicense ? { 'data-image-license': attributes.imageLicense } : {},
      },
      creator: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-creator'),
        renderHTML: (attributes) => attributes.creator ? { 'data-creator': attributes.creator } : {},
      },
    };
  },
});

export function Editor({
  html,
  onChange,
  onFindImages,
  placeholder = '从这里开始写——或者在左侧创作指令面板里点「生成」。',
  className,
}: {
  html: string;
  onChange: (html: string) => void;
  onFindImages?: () => void;
  placeholder?: string;
  className?: string;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      EvidenceImage.configure({ inline: false, allowBase64: true }),
      Placeholder.configure({ placeholder }),
      CharacterCount.configure({}),
    ],
    content: html || '',
    editorProps: {
      attributes: {
        class: 'prose-app max-w-prose focus:outline-none min-h-[60vh] py-6 px-8 mx-auto',
        role: 'textbox',
        'aria-label': '文章正文编辑器',
        'aria-multiline': 'true',
      },
      handlePaste(view, event) {
        const items = Array.from(event.clipboardData?.items ?? []);
        const imageItem = items.find((it) => it.type.startsWith('image/'));
        if (!imageItem) return false;
        const file = imageItem.getAsFile();
        if (!file) return false;
        event.preventDefault();
        void insertImageFile(view, file, null);
        return true;
      },
      handleDrop(view, event) {
        const file = event.dataTransfer?.files?.[0];
        if (!file || !file.type.startsWith('image/')) return false;
        event.preventDefault();
        void insertImageFile(view, file, { x: event.clientX, y: event.clientY });
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
    if (!editor) return;
    const choice = window.prompt('图片方式：(1) 粘贴图片 URL 或 dataURL；(2) 输入 upload 上传本地文件');
    if (!choice) return;
    if (choice.trim().toLowerCase() === 'upload') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = () => {
        const f = input.files?.[0];
        if (!f) return;
        void insertImageFile(editor.view, f, null);
      };
      input.click();
      return;
    }
    const src = choice.trim();
    const caption = window.prompt('图注（可选）：') ?? '';
    const alt = caption || '图片';
    const { state } = editor;
    const pos = state.selection.from;
    const node = state.schema.nodes.image.create({ src, alt });
    let tr = state.tr.replaceSelectionWith(node);
    // 光标会被放在图片节点上（NodeSelection），显式在图片之后插入图注，避免覆盖图片
    if (caption) tr = tr.insertText(`\n${caption}\n`, Math.min(pos + node.nodeSize, tr.doc.content.size));
    editor.view.dispatch(tr);
  }, [editor]);

  if (!editor) return <div className={cn('text-ink-muted text-sm p-8', className)}>加载编辑器…</div>;

  const chars = editor.storage.characterCount?.characters?.() ?? 0;

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="sticky top-0 z-10 border-b border-ink-line bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-prose flex items-center gap-1 overflow-x-auto px-4 py-2">
          <ToolbarBtn on={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="一级标题" aria-label="H1"><Heading1 size={14}/></ToolbarBtn>
          <ToolbarBtn on={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="二级标题" aria-label="H2"><Heading2 size={14}/></ToolbarBtn>
          <Sep/>
          <ToolbarBtn on={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="加粗" aria-label="加粗"><Bold size={14}/></ToolbarBtn>
          <ToolbarBtn on={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="斜体" aria-label="斜体"><Italic size={14}/></ToolbarBtn>
          <ToolbarBtn on={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="引用" aria-label="引用"><Quote size={14}/></ToolbarBtn>
          <ToolbarBtn on={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="无序列表" aria-label="列表"><List size={14}/></ToolbarBtn>
          <ToolbarBtn on={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()} title="行内代码" aria-label="代码"><Code size={14}/></ToolbarBtn>
          <Sep/>
          {onFindImages ? (
            <button
              type="button"
              onClick={onFindImages}
              className="h-10 shrink-0 px-3 inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors sm:h-7 sm:px-2 sm:text-xs"
              title="联网查找并插入有来源的图片"
            >
              <Images size={14}/> 配图
            </button>
          ) : (
            <ToolbarBtn onClick={insertImage} title="插入图片" aria-label="插入图片"><ImageIcon size={14}/></ToolbarBtn>
          )}
          <div className="ml-auto shrink-0 text-[11px] text-ink-muted tabular-nums">{chars} 字</div>
        </div>
      </div>
      <EditorContent editor={editor} className="flex-1 overflow-y-auto" />
    </div>
  );
}

// 图片文件 → 降采样 dataURL → 单事务插入（图片 + 图注），避免对旧 state 二次 dispatch
async function insertImageFile(
  view: EditorView,
  file: File,
  at: { x: number; y: number } | null,
) {
  let dataUrl: string;
  try {
    dataUrl = await downscaleImage(file);
  } catch {
    try {
      dataUrl = await blobToDataUrl(file);
    } catch {
      return;
    }
  }
  const caption = window.prompt('图注（可选，符合「图 N｜描述。图片来源：…」格式更佳）：') ?? '';
  const alt = caption || '图片';
  const { state } = view;
  const node = state.schema.nodes.image.create({ src: dataUrl, alt });
  const pos = at
    ? view.posAtCoords({ left: at.x, top: at.y })?.pos ?? state.selection.from
    : state.selection.from;
  const tr = state.tr;
  if (at) {
    tr.insert(pos, node);
  } else {
    tr.replaceSelectionWith(node);
  }
  // 光标会落在图片节点上（NodeSelection），显式在图片之后插入图注，避免覆盖图片
  if (caption) tr.insertText(`\n${caption}\n`, Math.min(pos + node.nodeSize, tr.doc.content.size));
  view.dispatch(tr);
}

function ToolbarBtn({ on, onClick, children, ...rest }: { on?: boolean; onClick: () => void; children: React.ReactNode; [k: string]: unknown }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'h-10 w-10 shrink-0 inline-flex items-center justify-center rounded text-ink-soft hover:bg-ink-panel sm:h-7 sm:w-7',
        on && 'bg-ink-panel text-ink',
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
function Sep() { return <span className="mx-1 h-4 w-px shrink-0 bg-ink-line" />; }
