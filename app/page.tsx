'use client';

import * as React from 'react';
import Link from 'next/link';
import { FileText, Plus, Sparkles, Smartphone, Copy, Layers } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { useArticleStore } from '@/src/lib/store';
import { Button } from '@/components/ui/button';
import type { Brief } from '@/src/lib/types';
import { DEFAULT_CONFIG, loadConfig } from '@/src/lib/config';

export default function HomePage() {
  const hydrate = useArticleStore((s) => s.hydrate);
  const articles = useArticleStore((s) => s.articles);
  const create = useArticleStore((s) => s.create);
  const [mounted, setMounted] = React.useState(false);
  const [aiReady, setAiReady] = React.useState<boolean | null>(null);
  React.useEffect(() => {
    hydrate(); setMounted(true);
    fetch('/api/ai-status').then((r) => r.json()).then((d: { configured: boolean }) => setAiReady(d.configured)).catch(() => setAiReady(false));
  }, [hydrate]);

  const onNew = (preset: Partial<Brief> = {}) => {
    const cfg = loadConfig();
    const a = create({
      material: '',
      materialType: 'topic',
      angle: '',
      voice: cfg.voice,
      length: 'medium',
      platforms: cfg.defaultPlatforms,
      bilingual: cfg.bilingual,
      ...preset,
    } as Brief);
    location.assign(`/article/${a.id}`);
  };

  return (
    <AppShell>
      <div className="h-full overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-12">
          <div className="text-[11px] uppercase tracking-[1.5px] text-ink-muted mb-3">Pencil · 中文写作 × 多平台排版</div>
          <h1 className="text-[34px] font-bold tracking-tightish leading-[1.15] mb-3">把任何素材，变成一套多平台可发布的内容包。</h1>
          <p className="text-ink-soft text-[15px] leading-relaxed mb-8">
            pen.dev 风格的写作工作台，专为公众号、X、知乎、小红书、B站、CSDN、Reddit、Hacker News、Product Hunt 设计。
            给素材 + 你的判断，AI 写母稿，逐平台适配，一键复制 / 下载 HTML+ZIP 离线发布。
          </p>
          <div className="flex flex-wrap gap-2 mb-10">
            <Button size="lg" onClick={() => onNew({ materialType: 'news' })}>
              <Plus size={15} className="mr-1.5"/> 从一条新闻开始
            </Button>
            <Button size="lg" variant="outline" onClick={() => onNew({ materialType: 'topic' })}>
              <Sparkles size={15} className="mr-1.5"/> 写一篇观点
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            <Feature icon={<Sparkles size={16}/>} title="AI 母稿" body="内置编辑准则 + 事实核查规则，MiniMax-M3 生成，去 AI 味、有判断。" />
            <Feature icon={<Smartphone size={16}/>} title="公众号石墨风" body="行内样式、移动端预览、复制按钮自动嵌入全部本地图。" />
            <Feature icon={<Layers size={16}/>} title="九平台适配" body="X / 知乎 / 小红书 / B站 / CSDN / Reddit / HN / PH 一稿多投，钩子、长度、CTA 各自重写。" />
          </div>

          <h2 className="text-sm font-semibold tracking-tightish mb-3">最近文章</h2>
          {mounted && articles.length === 0 && (
            <div className="text-sm text-ink-muted">还没有文章。点上面的按钮开始。</div>
          )}
          <ul className="divide-y divide-ink-line border-y border-ink-line">
            {articles.slice(0, 20).map((a) => (
              <li key={a.id}>
                <Link href={`/article/${a.id}`} className="flex items-center gap-3 py-3 hover:bg-ink-panel/40 px-2 -mx-2 rounded">
                  <FileText size={14} className="text-ink-muted"/>
                  <span className="flex-1 truncate text-sm">{a.title || '未命名'}</span>
                  <span className="text-[11px] text-ink-muted">{new Date(a.updatedAt).toLocaleString('zh-CN')}</span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-12 text-xs text-ink-muted">
            AI 状态：{aiReady === null ? '检测中…' : aiReady ? '已配置' : '未配置（设置 .env.local 后重启）'}。
            当前默认配置可在<a className="underline" href="/settings">设置</a>里改。
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-lg border border-ink-line bg-white p-4">
      <div className="flex items-center gap-2 mb-1.5 text-ink">{icon}<div className="text-sm font-medium">{title}</div></div>
      <div className="text-[13px] text-ink-soft leading-relaxed">{body}</div>
    </div>
  );
}
