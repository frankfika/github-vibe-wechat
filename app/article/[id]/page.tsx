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
import { loadAiConfig } from '@/src/lib/ai-config';
import { loadConfig } from '@/src/lib/config';
import { collectContentImages } from '@/src/lib/images';
import type { Brief, PlatformId } from '@/src/lib/types';
import { downloadBlob, markdownToInlineHtml } from '@/src/lib/export-html';
import { cn } from '@/components/ui/cn';
import { ErrorBanner, useError } from '@/components/ErrorBanner';

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
  // 窄屏（<1280px）折叠为「指令 / 编辑 / 发布」顶部 Tab
  const [mobileTab, setMobileTab] = React.useState<'brief' | 'editor' | 'publish'>('brief');
  const { error, show: showError, dismiss: dismissError } = useError();

  if (!hydrated) {
    return <AppShell><div className="p-10 text-ink-muted text-sm">载入中…</div></AppShell>;
  }
  if (!article) {
    return <AppShell><div className="p-10 text-ink-muted text-sm">文章不存在或已删除。<a href="/" className="underline">返回首页</a></div></AppShell>;
  }

  const onBrief = (brief: Brief) => update(article.id, { brief });
  const onTitle = (title: string) => update(article.id, { title });
  const onImportMaterial = (material: string) => {
    setContent(article.id, markdownToInlineHtml(material || ''));
  };

  const onGenerate = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          brief: article.brief,
          material: article.brief.material,
          ai: loadAiConfig(),
          config: { seriesTitle: loadConfig().seriesTitle },
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const { md, title } = (await res.json()) as { md: string; title?: string };
      // AI 返回的是 Markdown；转成语义 HTML 后写入编辑器（预览 / 复制 / 导出时再注入行内样式）。
      setContent(article.id, markdownToInlineHtml(md));
      if (title) onTitle(title);
    } catch (e) {
      showError((e as Error).message || '生成失败');
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
        body: JSON.stringify({ brief: article.brief, master: article.content, platform: p, ai: loadAiConfig() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const { text } = (await res.json()) as { text: string };
      setDraft(article.id, p, text);
    } catch (e) {
      showError((e as Error).message || '适配失败');
    } finally {
      setAdapting(null);
    }
  };

  const onExportZip = async () => {
    try {
      const cfg = loadConfig();
      // 收集文章内嵌图（blob → dataURL），随导出请求打包进 ZIP
      const images = await collectContentImages(article.content);
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: article.title,
          md: article.content,
          eyebrow: article.brief.materialType === 'news' ? cfg.newsEyebrow : cfg.wechatEyebrow,
          author: cfg.authorSignature,
          images,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      downloadBlob(blob, `${slug(article.title)}.zip`);
    } catch (e) {
      showError((e as Error).message || '导出失败');
    }
  };

  const briefPanel = article.brief.agentId ? (
    <AgentCompose brief={article.brief} onChange={onBrief} onGenerate={onGenerate} onImportMaterial={onImportMaterial} onError={showError} generating={generating} />
  ) : (
    <BriefPanel brief={article.brief} onChange={onBrief} onGenerate={onGenerate} onImportMaterial={onImportMaterial} onError={showError} generating={generating} />
  );

  const editorPanel = (
    <>
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
    </>
  );

  const publishPanel = (
    <>
      <ValidationStrip markdown={article.content} />
      <div className="h-[42%] border-b border-ink-line">
        <PreviewPane markdown={article.content} materialType={article.brief.materialType} />
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
    </>
  );

  return (
    <AppShell>
      <div className="h-full flex flex-col">
        {/* 窄屏顶部 Tab */}
        {error && <ErrorBanner message={error} onDismiss={dismissError}/>}
        <div className="xl:hidden flex items-center border-b border-ink-line bg-white px-2 shrink-0">
          {(
            [
              ['brief', '指令'],
              ['editor', '编辑'],
              ['publish', '发布'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setMobileTab(key)}
              className={cn(
                'h-9 px-4 text-sm border-b-2 -mb-px transition-colors',
                mobileTab === key ? 'border-ink text-ink font-medium' : 'border-transparent text-ink-muted hover:text-ink',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 桌面三栏；窄屏仅渲染当前 Tab */}
        <div className="flex-1 min-h-0 xl:grid xl:grid-cols-[320px_1fr_420px]">
          <div className={cn('h-full min-h-0 flex-col overflow-hidden', mobileTab === 'brief' ? 'flex' : 'hidden', 'xl:flex')}>
            {briefPanel}
          </div>
          <div className={cn('flex-col border-x border-ink-line bg-white min-w-0', mobileTab === 'editor' ? 'flex' : 'hidden', 'xl:flex')}>
            {editorPanel}
          </div>
          <div className={cn('flex-col min-w-0', mobileTab === 'publish' ? 'flex' : 'hidden', 'xl:flex')}>
            {publishPanel}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function slug(s: string) {
  return (s || 'article').toLowerCase().replace(/[^\w一-龥]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'article';
}
