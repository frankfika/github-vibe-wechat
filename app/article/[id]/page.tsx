'use client';

import * as React from 'react';
import { AppShell } from '@/components/AppShell';
import { BriefPanel } from '@/components/BriefPanel';
import { AgentCompose } from '@/components/AgentCompose';
import { Editor } from '@/components/Editor';
import { PreviewPane } from '@/components/PreviewPane';
import { PlatformTabs } from '@/components/PlatformTabs';
import { ValidationStrip } from '@/components/ValidationStrip';
import { useArticleStore } from '@/src/lib/store';
import type { Brief, PlatformId } from '@/src/lib/types';
import { downloadBlob, markdownToInlineHtml } from '@/src/lib/export-html';

export default function ArticlePage({ params }: { params: { id: string } }) {
  const hydrate = useArticleStore((s) => s.hydrate);
  const hydrated = useArticleStore((s) => s.hydrated);
  const article = useArticleStore((s) => s.articles.find((a) => a.id === params.id));
  const setContent = useArticleStore((s) => s.setContent);
  const setDraft = useArticleStore((s) => s.setDraft);
  const update = useArticleStore((s) => s.update);

  React.useEffect(() => { hydrate(); }, [hydrate]);

  const [generating, setGenerating] = React.useState(false);
  const [adapting, setAdapting] = React.useState<PlatformId | null>(null);

  if (!hydrated) {
    return <AppShell><div className="p-10 text-ink-muted text-sm">载入中…</div></AppShell>;
  }
  if (!article) {
    return <AppShell><div className="p-10 text-ink-muted text-sm">文章不存在或已删除。<a href="/" className="underline">返回首页</a></div></AppShell>;
  }

  const onBrief = (brief: Brief) => update(article.id, { brief });
  const onTitle = (title: string) => update(article.id, { title });

  const onGenerate = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ brief: article.brief, material: article.brief.material }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const { md, title } = (await res.json()) as { md: string; title?: string };
      // AI 返回的是 Markdown；转成 HTML（带 inline 样式）后再写入编辑器。
      // markdownToInlineHtml 对已是 HTML 的内容是幂等的（regex 不匹配，标签原样保留）。
      setContent(article.id, markdownToInlineHtml(md));
      if (title) onTitle(title);
    } catch (e) {
      alert((e as Error).message || '生成失败');
    } finally {
      setGenerating(false);
    }
  };

  const onAdapt = async (p: PlatformId) => {
    if (adapting) return;
    setAdapting(p);
    try {
      const res = await fetch('/api/adapt', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ brief: article.brief, master: article.content, platform: p }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const { text } = (await res.json()) as { text: string };
      setDraft(article.id, p, text);
    } catch (e) {
      alert((e as Error).message || '适配失败');
    } finally {
      setAdapting(null);
    }
  };

  const onExportZip = async () => {
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: article.title, md: article.content, format: 'zip' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      downloadBlob(blob, `${slug(article.title)}.zip`);
    } catch (e) {
      alert((e as Error).message || '导出失败');
    }
  };

  return (
    <AppShell>
      <div className="h-full grid grid-cols-[320px_1fr_420px]">
        {article.brief.agentId ? (
          <AgentCompose brief={article.brief} onChange={onBrief} onGenerate={onGenerate} generating={generating} />
        ) : (
          <BriefPanel brief={article.brief} onChange={onBrief} onGenerate={onGenerate} generating={generating} />
        )}

        <div className="flex flex-col border-x border-ink-line bg-white min-w-0">
          <div className="px-6 pt-4">
            <input
              value={article.title}
              onChange={(e) => onTitle(e.target.value)}
              placeholder="标题"
              className="w-full text-[22px] font-bold tracking-tightish bg-transparent focus:outline-none placeholder:text-ink-muted"
            />
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            <Editor
              html={article.content}
              onChange={(h) => setContent(article.id, h)}
            />
          </div>
        </div>

        <div className="flex flex-col min-w-0">
          <ValidationStrip markdown={article.content} />
          <div className="h-[42%] border-b border-ink-line">
            <PreviewPane markdown={article.content} />
          </div>
          <div className="flex-1 min-h-0">
            <PlatformTabs
              article={article}
              generating={adapting}
              onAdapt={onAdapt}
              onDraftChange={(p, t) => setDraft(article.id, p, t)}
              onExportZip={onExportZip}
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function slug(s: string) {
  return (s || 'article').toLowerCase().replace(/[^\w一-龥]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'article';
}
