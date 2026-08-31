'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUp, Github, Link2, Loader2, Sparkles } from 'lucide-react';
import { AGENTS, mergeBrief } from '@/src/lib/agents';
import { useArticleStore } from '@/src/lib/store';
import { composeFetchedMaterial, extractHttpUrls, fetchMaterialSources, isGitHubUrl } from '@/src/lib/material-input';
import { inferAgentId, inferPlatformsFromInstruction } from '@/src/lib/creator-intent';
import { loadConfig } from '@/src/lib/config';
import { cn } from './ui/cn';

const EXAMPLES = ['根据这个链接写一篇克制的新闻解读', '把我的 GitHub 项目发到全平台', '只排版下面这篇原稿，不要改写'];

export function QuickComposer({ compact = false, onComplete }: { compact?: boolean; onComplete?: () => void }) {
  const router = useRouter();
  const create = useArticleStore((state) => state.create);
  const [input, setInput] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const urls = React.useMemo(() => extractHttpUrls(input), [input]);
  const githubCount = urls.filter(isGitHubUrl).length;

  const submit = async () => {
    if (!input.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const sources = urls.length ? await fetchMaterialSources(urls) : [];
      const agentId = inferAgentId(input, urls);
      const agent = AGENTS.find((item) => item.id === agentId) ?? AGENTS[0];
      const preferredStyle = loadConfig().marketStyleId;
      const requestedPlatforms = inferPlatformsFromInstruction(input);
      const brief = mergeBrief(agent, undefined, {
        material: composeFetchedMaterial(input, urls, sources),
        ...(requestedPlatforms.length > 0 ? { platforms: requestedPlatforms } : {}),
        bilingual: /中英|双语|英文版|English/i.test(input),
        ...(preferredStyle ? { voice: preferredStyle } : {}),
      });
      const article = create(brief);
      useArticleStore.getState().update(article.id, {
        conversation: [
          { id: crypto.randomUUID(), role: 'user', content: input.trim(), createdAt: Date.now() },
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `我会按「${agent.name}」处理${brief.platforms.length ? `，并准备 ${brief.platforms.length} 个平台版本` : ''}。生成后可以继续直接告诉我怎么改。`,
            createdAt: Date.now(),
          },
        ],
      });
      onComplete?.();
      router.push(`/article/${article.id}?step=brief&generate=1`);
    } catch (reason) {
      setError((reason as Error).message || '暂时无法开始，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={cn('w-full', !compact && 'mx-auto max-w-3xl')}>
      <div className={cn(
        'overflow-hidden border border-white/90 bg-white/90 shadow-[0_24px_80px_rgba(79,70,229,0.13)] backdrop-blur-xl',
        compact ? 'rounded-2xl' : 'rounded-3xl',
      )}>
        <textarea
          aria-label="创作素材"
          value={input}
          onChange={(event) => { setInput(event.target.value); setError(null); }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              void submit();
            }
          }}
          rows={compact ? 5 : 7}
          autoFocus={compact}
          placeholder={'像和编辑说话一样告诉我：素材是什么、想表达什么、准备发到哪里。\n也可以直接粘贴正文、多个网页或 GitHub 链接…'}
          className={cn(
            'w-full resize-none border-0 bg-transparent px-5 pt-5 text-base leading-relaxed text-ink placeholder:text-ink-muted/80 focus:outline-none sm:px-6 sm:pt-6',
            compact ? 'min-h-40' : 'min-h-52 sm:text-lg',
          )}
        />

        {(urls.length > 0 || error) && (
          <div className="px-5 pb-2 sm:px-6">
            {urls.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-ink-muted">
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-indigo-700"><Link2 size={11}/> 已识别 {urls.length} 个链接</span>
                {githubCount > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-slate-700"><Github size={11}/> {githubCount} 个 GitHub 仓库</span>}
                {urls.length >= 8 && <span>一次最多读取前 8 个</span>}
              </div>
            )}
            {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-ink-line/80 bg-white/70 px-4 py-3 sm:px-5">
          <div className="inline-flex min-w-0 items-center gap-2 text-xs text-ink-muted">
            <Sparkles size={13} className="shrink-0 text-indigo-600"/>
            <span className="truncate">自动理解素材、写法、平台和语言</span>
          </div>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={!input.trim() || submitting}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-700 px-4 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md disabled:pointer-events-none disabled:opacity-40 sm:size-10 sm:px-0"
            aria-label="开始创作"
          >
            {submitting ? <Loader2 size={16} className="animate-spin"/> : <ArrowUp size={17}/>}<span className="sm:hidden">{submitting ? '正在读取素材' : '开始创作'}</span>
          </button>
        </div>
      </div>

      {!compact && (
        <div className="mt-4 flex flex-col items-center gap-3">
          <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
            {EXAMPLES.map((example) => (
              <button key={example} type="button" onClick={() => setInput(example)} className="h-10 shrink-0 rounded-full border border-white/90 bg-white/60 px-3 text-[11px] text-ink-muted hover:border-indigo-200 hover:bg-white hover:text-indigo-700 sm:h-9">
                {example}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[11px] text-ink-muted">
            <span className="inline-flex items-center gap-1.5"><Link2 size={12}/> 最多读取 8 个链接</span>
            <span className="inline-flex items-center gap-1.5"><Github size={12}/> 自动读取 GitHub README</span>
          </div>
        </div>
      )}
    </div>
  );
}
