'use client';

import * as React from 'react';
import { Copy, Check, Loader2, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { PLATFORMS } from '@/src/lib/platforms';
import type { Article, PlatformId } from '@/src/lib/types';
import { copyRichToClipboard } from '@/src/lib/export';

export function PlatformTabs({
  article,
  generating,
  onAdapt,
  onDraftChange,
  onExportZip,
}: {
  article: Article;
  generating: PlatformId | null;
  onAdapt: (p: PlatformId) => Promise<void>;
  onDraftChange: (p: PlatformId, text: string) => void;
  onExportZip: () => Promise<void>;
}) {
  const available = (article.brief.platforms.length ? article.brief.platforms : PLATFORM_ORDER) as PlatformId[];
  const [tab, setTab] = React.useState<PlatformId>(available[0] ?? 'wechat');
  const [copied, setCopied] = React.useState<PlatformId | null>(null);

  const draft = article.platformDrafts[tab] ?? '';
  const spec = PLATFORMS[tab];

  const onCopy = async () => {
    const ok = await copyRichToClipboard(`<pre>${escapeHtml(draft)}</pre>`, draft);
    if (ok) {
      setCopied(tab);
      setTimeout(() => setCopied(null), 1800);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <Tabs value={tab} onValueChange={(v) => setTab(v as PlatformId)} className="flex-1">
        <div className="px-4 pt-2 flex items-center justify-between border-b border-ink-line">
          <TabsList>
            {available.map((p) => (
              <TabsTrigger key={p} value={p}>
                {PLATFORMS[p].label}
                {article.platformDrafts[p] && <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-ink" />}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="flex items-center gap-1.5 pb-2">
            {spec.officialUrl && (
              <a href={spec.officialUrl} target="_blank" rel="noreferrer" className="text-xs text-ink-muted hover:text-ink inline-flex items-center gap-1">
                官方发布入口 <ExternalLink size={11}/>
              </a>
            )}
          </div>
        </div>

        {available.map((p) => (
          <TabsContent key={p} value={p} className="px-4">
            <PlatformBody
              platform={p}
              draft={article.platformDrafts[p] ?? ''}
              generating={generating === p}
              onAdapt={() => onAdapt(p)}
              onChange={(t) => onDraftChange(p, t)}
              onCopy={onCopy}
              copied={copied === p}
            />
          </TabsContent>
        ))}
      </Tabs>
      <div className="border-t border-ink-line p-2 flex items-center justify-end gap-2 bg-ink-panel/30">
        <Button variant="outline" size="sm" onClick={onExportZip}>
          下载 ZIP（含公众号 HTML + 图片 + md）
        </Button>
      </div>
    </div>
  );
}

function PlatformBody({
  platform,
  draft,
  generating,
  onAdapt,
  onChange,
  onCopy,
  copied,
}: {
  platform: PlatformId;
  draft: string;
  generating: boolean;
  onAdapt: () => void;
  onChange: (t: string) => void;
  onCopy: () => void;
  copied: boolean;
}) {
  const spec = PLATFORMS[platform];
  return (
    <div className="flex flex-col gap-3 pt-2">
      <div className="text-xs text-ink-muted">
        <span className="font-medium text-ink-soft">{spec.label}</span> · {spec.shape} · {spec.depth} · 复制模式 {spec.copyMode}
        {spec.maxChars ? ` · ≤${spec.maxChars} 字` : ''}
      </div>
      <textarea
        value={draft}
        onChange={(e) => onChange(e.target.value)}
        rows={16}
        className="w-full rounded-md border border-ink-line bg-white px-3 py-2 text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
        placeholder={`${spec.label} 的改写稿会在此显示。可以基于此人工微调。`}
      />
      <div className="flex items-center gap-2">
        <Button onClick={onAdapt} disabled={generating} size="sm">
          {generating ? <Loader2 size={13} className="animate-spin mr-1"/> : null}
          {generating ? '适配中…' : draft ? '重新适配' : '适配此平台'}
        </Button>
        <Button variant="outline" size="sm" onClick={onCopy} disabled={!draft}>
          {copied ? <Check size={13} className="mr-1"/> : <Copy size={13} className="mr-1"/>}
          {copied ? '已复制' : '复制文案'}
        </Button>
        <span className="text-xs text-ink-muted ml-auto">{draft.length} 字</span>
      </div>
    </div>
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
