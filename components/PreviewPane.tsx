'use client';

import * as React from 'react';
import { Copy, Check, Smartphone, Monitor } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from './ui/toast';
import { copyRichToClipboard, markdownToInlineHtml, mdToPlainText } from '@/src/lib/export-html';

export function PreviewPane({ markdown }: { markdown: string }) {
  const [copied, setCopied] = React.useState(false);
  const [width, setWidth] = React.useState<'mobile' | 'desktop'>('mobile');
  const { push } = useToast();
  const html = React.useMemo(() => markdownToInlineHtml(markdown || ''), [markdown]);

  const onCopy = async () => {
    // 兜底文本用纯文本，而不是把原始 markdown（# * ![]）粘出去。
    const ok = await copyRichToClipboard(html, mdToPlainText(markdown));
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } else {
      push('error', '复制失败：浏览器拒绝了剪贴板访问。请手动全选复制。');
    }
  };

  return (
    <div className="flex flex-col h-full bg-ink-panel/40">
      <div className="flex items-center justify-between gap-2 px-4 h-11 border-b border-ink-line bg-white">
        <div className="text-xs font-medium text-ink-soft shrink-0">公众号预览</div>
        <div className="flex items-center gap-1.5">
          <SegBtn active={width === 'mobile'} onClick={() => setWidth('mobile')} label="移动端预览"><Smartphone size={13} /></SegBtn>
          <SegBtn active={width === 'desktop'} onClick={() => setWidth('desktop')} label="桌面预览"><Monitor size={13} /></SegBtn>
          <Button size="sm" variant={copied ? 'secondary' : 'primary'} onClick={onCopy} className="ml-1">
            {copied ? <Check size={13} className="mr-1" /> : <Copy size={13} className="mr-1" />}
            {copied ? '已复制' : '复制正文'}
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className={`mx-auto bg-white border border-ink-line shadow-sm rounded-md overflow-hidden ${width === 'mobile' ? 'max-w-[375px]' : 'max-w-[680px]'}`}>
          <div className="wechat-preview" dangerouslySetInnerHTML={{ __html: html || '<p class="text-ink-muted" style="color:#6e6e73">在编辑器或顶部指令面板里生成/写入内容，预览会实时出现。</p>' }} />
        </div>
      </div>
    </div>
  );
}

function SegBtn({ active, onClick, label, children }: { active: boolean; onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={
        'h-8 w-8 inline-flex items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink ' +
        (active ? 'bg-ink text-white' : 'text-ink-muted hover:bg-ink-panel')
      }
    >
      {children}
    </button>
  );
}
