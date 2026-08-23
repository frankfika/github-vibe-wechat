'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { PenTool, Settings, Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useArticleStore } from '@/src/lib/store';
import { Button } from './ui/button';
import { cn } from './ui/cn';
import { ConfirmDialog } from './ui/modal';
import type { Brief } from '@/src/lib/types';
import { loadConfig } from '@/src/lib/config';

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

/** 桌面宽出现侧栏时的断点（与 tailwind `lg` 一致） */
const DESKTOP_QUERY = '(min-width: 1024px)';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const hydrate = useArticleStore((s) => s.hydrate);
  const hydrated = useArticleStore((s) => s.hydrated);
  const articles = useArticleStore((s) => s.articles);
  const create = useArticleStore((s) => s.create);
  const remove = useArticleStore((s) => s.remove);

  const [sidebarOpen, setSidebarOpen] = React.useState(true); // SSR/首帧一致，避免 hydration 不匹配；mount 后同步真实断点
  const [deleting, setDeleting] = React.useState<{ id: string; title: string } | null>(null);

  React.useEffect(() => { hydrate(); }, [hydrate]);

  // 首帧后把侧栏态同步到真实断点，并跨断点联动（进入桌面默认打开，离开桌面收拢防挡内容）。
  React.useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    setSidebarOpen(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setSidebarOpen(e.matches);
    if (mq.addEventListener) {
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    }
    return undefined;
  }, []);

  const onNew = () => {
    const a = create(makeBrief());
    router.push(`/article/${a.id}`);
    setSidebarOpen(false);
  };

  const rail = (
    <div className="flex w-14 shrink-0 flex-col items-center gap-1 border-r border-ink-line bg-ink-panel/50 py-3">
      <Link
        href="/"
        className="flex h-9 w-9 items-center justify-center rounded-md text-ink hover:bg-white"
        aria-label="Pencil 首页"
      >
        <PenTool size={17} />
      </Link>
      <button
        onClick={() => setSidebarOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-md text-ink-muted hover:bg-white hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
        aria-label={sidebarOpen ? '收起文章侧栏' : '展开文章侧栏'}
        aria-expanded={sidebarOpen}
      >
        {sidebarOpen ? <ChevronLeft size={17} /> : <ChevronRight size={17} />}
      </button>
      <div className="flex-1" />
      <Link
        href="/settings"
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-md text-ink-muted hover:bg-white hover:text-ink',
          pathname === '/settings' && 'bg-white text-ink',
        )}
        aria-label="设置"
      >
        <Settings size={16} />
      </Link>
    </div>
  );

  // 窄屏：整个侧栏是从左滑出的抽屉，配遮罩打断点击，不挤占主内容。
  // 宽屏：侧栏在文档流中占 240px，可被 rail 按钮收起（编辑区变宽）。
  const sidebar = (
    <aside
      className={cn(
        'z-40 flex h-full w-60 flex-col border-r border-ink-line bg-ink-panel/40',
        // 手机：off-canvas
        'fixed inset-y-0 left-14 transition-transform duration-200',
        sidebarOpen ? 'translate-x-0' : '-translate-x-[200%]',
        // 桌面：回流，配合 rail 收起
        'lg:static lg:inset-auto lg:left-auto lg:translate-x-0 lg:transition-[width]',
        sidebarOpen ? 'lg:w-60' : 'lg:w-0 lg:overflow-hidden lg:border-0',
      )}
    >
      <div className="flex items-center gap-2 border-b border-ink-line px-3 h-11 shrink-0">
        <Link href="/" className="font-semibold tracking-tightish text-sm sm:text-base">Pencil</Link>
        <span className="ml-auto text-[11px] text-ink-muted hidden min-[420px]:block">写作 × 多平台</span>
      </div>
      <div className="p-2">
        <Button onClick={onNew} size="md" className="w-full"><Plus size={14} className="mr-1.5" /> 新建文章</Button>
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
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm hover:bg-white',
                    active && 'border-l-2 border-ink bg-white',
                  )}
                >
                  <PenTool size={13} className="text-ink-muted shrink-0" />
                  <span className="truncate">{a.title || '未命名'}</span>
                </Link>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setDeleting({ id: a.id, title: a.title || '未命名' });
                  }}
                  className={cn(
                    'absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1.5 text-ink-muted',
                    'hover:text-red-600 hover:bg-red-50',
                    'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink',
                  )}
                  aria-label={`删除 ${a.title || '未命名'}`}
                  title="删除"
                >
                  <Trash2 size={13} />
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-white">
      {rail}
      {/* 手机抽屉遮罩 */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-ink/30" onClick={() => setSidebarOpen(false)} aria-hidden />
      )}
      {sidebar}
      <main className="relative min-w-0 flex-1 overflow-hidden">{children}</main>

      <ConfirmDialog
        open={!!deleting}
        title="删除文章"
        message={`确定删除 "${deleting?.title ?? ''}"？此操作无法撤销。`}
        confirmLabel="删除"
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          remove(deleting.id);
          if (pathname === `/article/${deleting.id}`) router.push('/');
          setDeleting(null);
        }}
      />
    </div>
  );
}