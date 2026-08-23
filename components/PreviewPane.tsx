'use client';

import * as React from 'react';
import { Copy, Check, Smartphone, Monitor } from 'lucide-react';
import { Button } from './ui/button';
import { copyRichToClipboard, markdownToInlineHtml } from '@/src/lib/export';

export function PreviewPane({ markdown }: { markdown: string }) {
  const [copied, setCopied] = React.useState(false);
  const [width, setWidth] = React.useState<'mobile' | 'desktop'>('mobile');
  const html = React.useMemo(() => markdownToInlineHtml(markdown || ''), [markdown]);

  const onCopy = async () => {
    const ok = await copyRichToClipboard(html, markdown);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <div className="flex flex-col h-full bg-ink-panel/40">
      <div className="flex items-center justify-between px-4 h-10 border-b border-ink-line bg-white">
        <div className="text-xs font-medium text-ink-soft">公众号预览</div>
        <div className="flex items-center gap-1.5">
          <SegBtn active={width === 'mobile'} onClick={() => setWidth('mobile')}><Smartphone size={13}/></SegBtn>
          <SegBtn active={width === 'desktop'} onClick={() => setWidth('desktop')}><Monitor size={13}/></SegBtn>
          <Button size="sm" variant={copied ? 'secondary' : 'primary'} onClick={onCopy}>
            {copied ? <Check size={13} className="mr-1"/> : <Copy size={13} className="mr-1"/>}
            {copied ? '已复制' : '复制公众号正文'}
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className={`mx-auto bg-white border border-ink-line shadow-sm rounded-md overflow-hidden ${width === 'mobile' ? 'max-w-[375px]' : 'max-w-[680px]'}`}>
          <div className="wechat-preview" dangerouslySetInnerHTML={{ __html: html || '<p style="color:#86868b">在编辑器或左侧指令面板里生成/写入内容，预览会实时出现。</p>' }} />
        </div>
      </div>
    </div>
  );
}

function SegBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={
        'h-7 w-7 inline-flex items-center justify-center rounded ' +
        (active ? 'bg-ink text-white' : 'text-ink-muted hover:bg-ink-panel')
      }
    >
      {children}
    </button>
  );
}
