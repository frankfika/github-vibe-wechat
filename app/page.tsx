'use client';

import * as React from 'react';
import Link from 'next/link';
import { FileText, Plus, PenLine } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { useArticleStore } from '@/src/lib/store';
import { useAiStatus } from '@/src/lib/use-ai-status';
import { AiSetupGuide } from '@/components/AiSetupGuide';
import { AGENTS, GROUP_LABELS, mergeBrief } from '@/src/lib/agents';
import type { AgentGroup, WriterAgent } from '@/src/lib/agents';
import { cn } from '@/components/ui/cn';
import { loadConfig } from '@/src/lib/config';
import type { Brief } from '@/src/lib/types';

const GROUPS: AgentGroup[] = ['news', 'opinion', 'project', 'commercial', 'craft'];

export default function HomePage() {
  const hydrate = useArticleStore((s) => s.hydrate);
  const articles = useArticleStore((s) => s.articles);
  const create = useArticleStore((s) => s.create);
  const { aiReady, refresh } = useAiStatus();

  React.useEffect(() => { hydrate(); }, [hydrate]);

  const onNewAgent = (agent: WriterAgent) => {
    const a = create(mergeBrief(agent));
    location.assign(`/article/${a.id}`);
  };

  // 不走 Agent 的全手动入口（老工作流）
  const onBlank = () => {
    const cfg = loadConfig();
    const a = create({
      material: '',
      materialType: 'topic',
      angle: '',
      voice: cfg.voice,
      length: 'medium',
      platforms: cfg.defaultPlatforms,
      bilingual: cfg.bilingual,
    } as Brief);
    location.assign(`/article/${a.id}`);
  };

  return (
    <AppShell>
      <div className="h-full overflow-y-auto">
        <div className="max-w-5xl mx-auto px-8 py-10">
          <div className="text-[11px] uppercase tracking-[1.5px] text-ink-muted mb-3">OmniWriter · 多平台 AI 创作工作台</div>
          <h1 className="text-[30px] font-bold tracking-tightish leading-[1.15] mb-2">选一个 Agent，贴素材，就能生成。</h1>
          <p className="text-ink-soft text-[14px] leading-relaxed mb-6">
            每个 Agent 已预置语气、长度、平台与写作风格。点开卡片 → 贴素材 → 标发布地点 → 生成母稿，剩下的交给代理。
          </p>

          {aiReady === false && (
            <details className="mb-6 rounded-lg border border-amber-300 bg-amber-50/70">
              <summary className="px-3 py-2.5 cursor-pointer text-[13px] font-medium text-amber-900 select-none">
                未配置 AI 密钥——点此查看 3 步配置（不配置也能用编辑器与「纯排版」Agent）
              </summary>
              <div className="px-3 pb-3">
                <AiSetupGuide onRefresh={refresh} compact/>
              </div>
            </details>
          )}
          {aiReady === true && (
            <div className="mb-6 text-[12.5px] text-emerald-700 inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"/> AI 已配置，可以生成母稿
            </div>
          )}

          {GROUPS.map((g) => {
            const list = AGENTS.filter((a) => a.group === g);
            if (!list.length) return null;
            return (
              <section key={g} className="mb-8">
                <h2 className="text-[13px] font-semibold tracking-tightish text-ink-muted mb-3 px-0.5">{GROUP_LABELS[g]}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {list.map((a) => (
                    <AgentCard key={a.id} agent={a} onClick={() => onNewAgent(a)}/>
                  ))}
                </div>
              </section>
            );
          })}

          <div className="flex items-center gap-4 mt-2 mb-8 text-[13px] text-ink-muted">
            <button onClick={onBlank} className="inline-flex items-center gap-1.5 hover:text-ink underline underline-offset-2">
              <PenLine size={14}/> 空白手写（全手动模式）
            </button>
            <Link href="/settings" className="inline-flex items-center gap-1.5 hover:text-ink underline underline-offset-2">
              设置
            </Link>
          </div>

          <h2 className="text-[13px] font-semibold tracking-tightish text-ink-muted mb-3 px-0.5">最近文章</h2>
          {articles.length === 0 && <div className="text-sm text-ink-muted px-0.5">还没有文章。点上面的 Agent 卡片开始。</div>}
          <ul className="divide-y divide-ink-line border-y border-ink-line">
            {articles.slice(0, 30).map((a) => (
              <li key={a.id}>
                <Link href={`/article/${a.id}`} className="flex items-center gap-3 py-3 hover:bg-ink-panel/40 px-2 -mx-2 rounded">
                  <FileText size={14} className="text-ink-muted"/>
                  <span className="flex-1 truncate text-sm">{a.title || '未命名'}</span>
                  <span className="text-[11px] text-ink-muted">{new Date(a.updatedAt).toLocaleString('zh-CN')}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AppShell>
  );
}

function AgentCard({ agent, onClick }: { agent: WriterAgent; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group text-left rounded-xl border border-ink-line bg-white p-4 hover:border-ink hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-[26px] leading-none">{agent.emoji}</span>
        <Plus size={14} className="text-ink-muted opacity-0 group-hover:opacity-100 transition-opacity mt-0.5"/>
      </div>
      <div className={cn('text-sm font-semibold mb-1')}>{agent.name}</div>
      <div className="text-[12px] text-ink-soft leading-snug mb-2">{agent.description}</div>
      <div className="text-[11px] text-ink-muted border-t border-ink-line pt-2">贴什么：{agent.inputHint}</div>
    </button>
  );
}