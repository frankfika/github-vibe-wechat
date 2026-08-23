'use client';

import * as React from 'react';
import { AppShell } from '@/components/AppShell';
import { BriefPanel } from '@/components/BriefPanel';
import { Editor } from '@/components/Editor';
import { PreviewPane } from '@/components/PreviewPane';
import { PlatformTabs } from '@/components/PlatformTabs';
import { ValidationStrip } from '@/components/ValidationStrip';
import { useArticleStore } from '@/src/lib/store';
import type { Brief, PlatformId } from '@/src/lib/types';
import { downloadBlob, markdownToInlineHtml } from '@/src/lib/export-html';
import { useToast } from '@/components/ui/toast';
import { ConfirmDialog } from '@/components/ui/modal';
import { cn } from '@/components/ui/cn';

type MobileView = 'brief' | 'editor' | 'preview' | 'platform';

export default function ArticlePage({ params }: { params: { id: string } }) {
  const hydrate = useArticleStore((s) => s.hydrate);
  const hydrated = useArticleStore((s) => s.hydrated);
  const article = useArticleStore((s) => s.articles.find((a) => a.id === params.id));
  const setContent = useArticleStore((s) => s.setContent);
  const setDraft = useArticleStore((s) => s.setDraft);
  const update = useArticleStore((s) => s.update);
  const { push } = useToast();

  React.useEffect(() => { hydrate(); }, [hydrate]);

  const [generating, setGenerating] = React.useState(false);
  const [adapting, setAdapting] = React.useState<PlatformId | null>(null);
  const [pendingGen, setPendingGen] = React.useState<{ html: string; title?: string } | null>(null);
  const [view, setView] = React.useState<MobileView>('editor');
  const abortRef = React.useRef<AbortController | null>(null);
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  // 切文章：重置 AI 状态并中止在途请求，避免上一篇文章的生成态串到新文章。
  React.useEffect(() => {
    setGenerating(false);
    setAdapting(null);
    setPendingGen(null);
    abortRef.current?.abort();
    abortRef.current = null;
  }, [params.id]);

  if (!hydrated) {
    return <AppShell><div className="p-10 text-ink-muted text-sm">载入中…</div></AppShell>;
  }
  if (!article) {
    return <AppShell><div className="p-10 text-ink-muted text-sm">文章不存在或已删除。<a href="/" className="underline">返回首页</a></div></AppShell>;
  }

  const onBrief = (brief: Brief) => update(article.id, { brief });
  const onTitle = (title: string) => update(article.id, { title });

  const onGenerate = async () => {
    if (generating || adapting) return;
    setGenerating(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ brief: article.brief, material: article.brief.material }),
        signal: controller.signal,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const { md, title } = (await res.json()) as { md: string; title?: string };
      const html = markdownToInlineHtml(md);
      // AI 返回的是 Markdown；转成 HTML（带 inline 样式）后再写入编辑器。
      // markdownToInlineHtml 对已是 HTML 的内容幂等。
      if (article.content.trim()) {
        // 已有正文：进入待确认，防止误覆盖丢稿。
        setPendingGen({ html, title });
      } else {
        setContent(article.id, html);
        if (title) onTitle(title);
        push('success', '母稿已生成');
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      push('error', (e as Error).message || '生成失败');
    } finally {
      setGenerating(false);
      abortRef.current = null;
    }
  };

  const onAdapt = async (p: PlatformId) => {
    if (adapting || generating) return;
    setAdapting(p);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch('/api/adapt', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ brief: article.brief, master: article.content, platform: p }),
        signal: controller.signal,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const { text } = (await res.json()) as { text: string };
      setDraft(article.id, p, text);
      push('success', `${p} 适配完成`);
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      push('error', (e as Error).message || '适配失败');
    } finally {
      setAdapting(null);
      abortRef.current = null;
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
      push('success', '已导出 ZIP');
    } catch (e) {
      push('error', (e as Error).message || '导出失败');
    }
  };

  const editorCol = (
    <div className="flex h-full flex-col border-x border-ink-line bg-white min-w-0">
      <div className="px-6 pt-4">
        <input
          value={article.title}
          onChange={(e) => onTitle(e.target.value)}
          placeholder="标题"
          aria-label="文章标题"
          className="w-full text-xl sm:text-[22px] font-bold tracking-tightish bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 rounded placeholder:text-ink-muted-weak"
        />
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <Editor html={article.content} onChange={(h) => setContent(article.id, h)} />
      </div>
    </div>
  );

  const rightCol = (
    <div className="flex h-full flex-col min-w-0">
      <ValidationStrip markdown={article.content} />
      <div className="flex-1 min-h-0 border-b border-ink-line">
        <PreviewPane markdown={article.content} />
      </div>
    </div>
  );

  const platformCol = (
    <div className="flex h-full flex-col min-w-0 bg-white">
      <PlatformTabs
        article={article}
        generating={adapting}
        onAdapt={onAdapt}
        onDraftChange={(p, t) => setDraft(article.id, p, t)}
        onExportZip={onExportZip}
      />
    </div>
  );

  const navItems: { key: MobileView; label: string }[] = [
    { key: 'brief', label: '指令' },
    { key: 'editor', label: '编辑' },
    { key: 'preview', label: '预览' },
    { key: 'platform', label: '平台' },
  ];

  return (
    <AppShell>
      <div className="flex h-full flex-col">
        {/* 窄屏顶部分 Tab：桌面隐藏 */}
        <div className="lg:hidden flex items-center gap-1 border-b border-ink-line px-2 py-1.5">
          {navItems.map((n) => (
            <button
              key={n.key}
              onClick={() => setView(n.key)}
              aria-pressed={view === n.key}
              className={cn(
                'flex-1 rounded-md h-8 text-sm',
                view === n.key ? 'bg-ink text-white' : 'text-ink-soft hover:bg-ink-panel',
              )}
            >
              {n.label}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0">
          {isDesktop ? (
            <div className="grid h-full grid-cols-[300px_minmax(0,1fr)_400px]">
              <div className="min-w-0 border-r border-ink-line">
                <BriefPanel brief={article.brief} onChange={onBrief} onGenerate={onGenerate} generating={generating} />
              </div>
              {editorCol}
              <div className="flex min-w-0 flex-col">
                <div className="flex-1 min-h-0 flex flex-col">
                  {rightCol}
                </div>
                <div className="h-[46%] min-h-0 border-t border-ink-line">{platformCol}</div>
              </div>
            </div>
          ) : (
            <>
              {view === 'brief' && (
                <BriefPanel brief={article.brief} onChange={onBrief} onGenerate={onGenerate} generating={generating} />
              )}
              {view === 'editor' && editorCol}
              {view === 'preview' && rightCol}
              {view === 'platform' && platformCol}
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!pendingGen}
        title="替换当前正文"
        message="新生成的母稿将覆盖当前正文。想保留的部分请先复制走。"
        confirmLabel="覆盖正文"
        onCancel={() => setPendingGen(null)}
        onConfirm={() => {
          if (!pendingGen) return;
          setContent(article.id, pendingGen.html);
          if (pendingGen.title) onTitle(pendingGen.title);
          setPendingGen(null);
          push('success', '母稿已应用');
        }}
      />
    </AppShell>
  );
}

function slug(s: string) {
  return (s || 'article').toLowerCase().replace(/[^\w一-龥]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'article';
}

function useMediaQuery(query: string): boolean {
  // 默认 true 以与 SSR 对齐（桌面布局），首帧后再由真实视口校正，避免 hydration 不匹配。
  const [matches, setMatches] = React.useState(true);
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    mq.addEventListener('change', onChange);
    setMatches(mq.matches);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}