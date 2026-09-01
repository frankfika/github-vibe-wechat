'use client';

import * as React from 'react';
import { cn } from './cn';

interface TabsContextValue {
  value: string;
  setValue: (v: string) => void;
}
const TabsContext = React.createContext<TabsContextValue | null>(null);

export function Tabs({
  value,
  onValueChange,
  children,
  className,
}: {
  value: string;
  onValueChange: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <TabsContext.Provider value={{ value, setValue: onValueChange }}>
      <div className={cn('flex flex-col', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  // 标签组键盘导航：←/→ 与 Home/End 在平台间移动焦点（WAI-ARIA Tabs 模式）。
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft' && event.key !== 'Home' && event.key !== 'End') return;
    const buttons = Array.from((event.currentTarget as HTMLElement).querySelectorAll<HTMLButtonElement>('button[role="tab"]:not([disabled])'));
    if (!buttons.length) return;
    const last = buttons.length - 1;
    const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
    let next = -1;
    if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = last;
    else if (event.key === 'ArrowRight') next = current === -1 ? 0 : current === last ? 0 : current + 1;
    else next = current === -1 ? last : current === 0 ? last : current - 1;
    event.preventDefault();
    buttons[next].focus();
  };
  return (
    <div role="tablist" onKeyDown={onKeyDown} className={cn('flex flex-wrap gap-1 border-b border-ink-line', className)}>{children}</div>
  );
}

export function TabsTrigger({ value, children }: { value: string; children: React.ReactNode }) {
  const ctx = React.useContext(TabsContext)!;
  const active = ctx.value === value;
  return (
    <button
      role="tab"
      aria-selected={active}
      tabIndex={active ? 0 : -1}
      onClick={() => ctx.setValue(value)}
      className={cn(
        'h-10 px-3 text-sm whitespace-nowrap shrink-0 border-b-2 -mb-px transition-colors sm:h-8',
        active
          ? 'border-ink text-ink font-medium'
          : 'border-transparent text-ink-muted hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const ctx = React.useContext(TabsContext)!;
  if (ctx.value !== value) return null;
  return <div role="tabpanel" className={cn('pt-3', className)}>{children}</div>;
}
