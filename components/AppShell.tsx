'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FileText, Settings, Plus, Trash2 } from 'lucide-react';
import { useArticleStore } from '@/src/lib/store';
import { Button } from './ui/button';
import { cn } from './ui/cn';
import type { Brief } from '@/src/lib/types';
import { DEFAULT_CONFIG, loadConfig } from '@/src/lib/config';

function makeBrief(): Brief {
  const cfg = loadConfig();
  return {
    material: '',
    materialType: 'topic',
    angle: '',
    voice: cfg.voice,
    length: 'medium',
    platforms: cfg.defaultPlatforms,
    bilingual: cfg.bilingual,
    cta: '',
  };
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const hydrate = useArticleStore((s) => s.hydrate);
  const hydrated = useArticleStore((s) => s.hydrated);
  const articles = useArticleStore((s) => s.articles);
  const create = useArticleStore((s) => s.create);
  const remove = useArticleStore((s) => s.remove);

  React.useEffect(() => { hydrate(); }, [hydrate]);

  const onNew = () => {
    const a = create(makeBrief());
    router.push(`/article/${a.id}`);
  };

  return (
    <div className="h-screen w-screen grid grid-cols-[260px_1fr] overflow-hidden">
      <aside className="border-r border-ink-line bg-ink-panel/30 flex flex-col">
        <div className="px-4 h-12 flex items-center border-b border-ink-line">
          <Link href="/" className="font-semibold tracking-tightish">Pencil</Link>
          <span className="ml-2 text-[11px] text-ink-muted">写作 × 多平台</span>
        </div>
        <div className="p-2">
          <Button onClick={onNew} size="md" className="w-full"><Plus size={14} className="mr-1.5"/> 新建文章</Button>
        </div>
        <nav className="flex-1 overflow-y-auto px-1.5 pb-2">
          {hydrated && articles.length === 0 && (
            <div className="px-3 py-6 text-xs text-ink-muted">还没有文章。点"新建文章"开始。</div>
          )}
          <ul className="flex flex-col gap-0.5">
            {articles.map((a) => {
              const active = pathname === `/article/${a.id}`;
              return (
                <li key={a.id} className="group relative">
                  <Link
                    href={`/article/${a.id}`}
                    className={cn(
                      'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm hover:bg-white',
                      active && 'bg-white shadow-[inset_2px_0_0_#1d1d1f]',
                    )}
                  >
                    <FileText size={13} className="text-ink-muted shrink-0"/>
                    <span className="truncate">{a.title || '未命名'}</span>
                  </Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      if (confirm(`删除 "${a.title || '未命名'}"？`)) {
                        remove(a.id);
                        if (active) router.push('/');
                      }
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-ink-muted hover:text-red-600"
                    title="删除"
                  >
                    <Trash2 size={12}/>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="p-2 border-t border-ink-line">
          <Link
            href="/settings"
            className={cn(
              'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm hover:bg-white',
              pathname === '/settings' && 'bg-white',
            )}
          >
            <Settings size={13} className="text-ink-muted"/>
            设置
          </Link>
        </div>
      </aside>
      <main className="overflow-hidden">{children}</main>
    </div>
  );
}
