'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FileText, Settings, Plus, Trash2 } from 'lucide-react';
import { useArticleStore } from '@/src/lib/store';
import { Button } from './ui/button';
import { cn } from './ui/cn';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const hydrate = useArticleStore((s) => s.hydrate);
  const hydrated = useArticleStore((s) => s.hydrated);
  const articles = useArticleStore((s) => s.articles);
  const remove = useArticleStore((s) => s.remove);

  React.useEffect(() => { hydrate(); }, [hydrate]);

  return (
    <div className="h-screen w-screen grid grid-cols-1 xl:grid-cols-[260px_1fr] overflow-hidden">
      <aside className="hidden xl:flex border-r border-ink-line bg-ink-panel/30 flex-col">
        <div className="px-4 h-12 flex items-center border-b border-ink-line">
          <Link href="/" className="font-semibold tracking-tightish">OmniWriter</Link>
          <span className="ml-2 text-[11px] text-ink-muted">写作 × 多平台</span>
        </div>
        <div className="p-2">
          <Button onClick={() => router.push('/')} size="md" className="w-full"><Plus size={14} className="mr-1.5"/> 选 Agent</Button>
        </div>
        <nav className="flex-1 overflow-y-auto px-1.5 pb-2">
          {hydrated && articles.length === 0 && (
            <div className="px-3 py-6 text-xs text-ink-muted">还没有文章。点「选 Agent」开始。</div>
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
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-muted hover:text-red-600 opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
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

      <div className="flex flex-col min-w-0">
        {/* 移动端顶栏 */}
        <div className="xl:hidden flex items-center justify-between px-4 h-12 border-b border-ink-line bg-white shrink-0">
          <Link href="/" className="font-semibold tracking-tightish">OmniWriter</Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/" className="inline-flex items-center gap-1 hover:text-ink text-ink-muted">
              <Plus size={14}/> 选 Agent
            </Link>
            <Link href="/settings" className="inline-flex items-center gap-1 hover:text-ink text-ink-muted">
              <Settings size={14}/> 设置
            </Link>
          </div>
        </div>
        <main className="flex-1 min-h-0 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
