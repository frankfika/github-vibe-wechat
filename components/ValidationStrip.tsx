'use client';

import * as React from 'react';
import { AlertTriangle, AlertOctagon, Info, CheckCircle2 } from 'lucide-react';
import { validateMarkdown } from '@/src/lib/editorial';
import { cn } from './ui/cn';

export function ValidationStrip({ markdown }: { markdown: string }) {
  const issues = React.useMemo(() => validateMarkdown(markdown || ''), [markdown]);

  const high = issues.filter((i) => i.severity === 'high');
  const med = issues.filter((i) => i.severity === 'medium');
  const low = issues.filter((i) => i.severity === 'low');

  const clean = issues.length === 0 && (markdown || '').trim().length > 0;

  return (
    <div className="border-b border-ink-line bg-white px-4 py-2 h-11 flex items-center text-xs">
      {clean ? (
        <div className="flex items-center gap-2 text-emerald-700">
          <CheckCircle2 size={13} /> 符合编辑准则，无待处理项
        </div>
      ) : issues.length === 0 ? (
        <div className="text-ink-muted">校验会随内容实时更新</div>
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          {high.length > 0 && (
            <Badge tone="red" icon={<AlertOctagon size={12}/>}>{high.length} 高</Badge>
          )}
          {med.length > 0 && (
            <Badge tone="amber" icon={<AlertTriangle size={12}/>}>{med.length} 中</Badge>
          )}
          {low.length > 0 && (
            <Badge tone="muted" icon={<Info size={12}/>}>{low.length} 低</Badge>
          )}
          <details className="ml-1 cursor-pointer">
            <summary className="text-ink-muted hover:text-ink select-none">查看问题</summary>
            <ul className="mt-1.5 space-y-1 text-ink-soft">
              {issues.map((i, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className={cn('mt-0.5', i.severity === 'high' ? 'text-red-600' : i.severity === 'medium' ? 'text-amber-600' : 'text-ink-muted')}>
                    {i.severity === 'high' ? '●' : i.severity === 'medium' ? '●' : '○'}
                  </span>
                  <span>{i.message}</span>
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}
    </div>
  );
}

function Badge({ tone, icon, children }: { tone: 'red' | 'amber' | 'muted'; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
        tone === 'red' && 'bg-red-50 text-red-700',
        tone === 'amber' && 'bg-amber-50 text-amber-700',
        tone === 'muted' && 'bg-ink-panel text-ink-soft',
      )}
    >
      {icon}
      {children}
    </span>
  );
}
