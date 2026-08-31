'use client';

import type { ReactNode } from 'react';
import type { ContentLanguage } from '@/src/lib/bilingual';
import { cn } from './ui/cn';

export function LanguageTabs({
  value,
  onChange,
  hasEnglish,
  compact = false,
}: {
  value: ContentLanguage;
  onChange: (language: ContentLanguage) => void;
  hasEnglish: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className="inline-flex shrink-0 items-center rounded-xl border border-[#e4e7f1] bg-[#f3f5fb] p-1"
      role="tablist"
      aria-label="稿件语言"
    >
      <LanguageTab active={value === 'zh'} compact={compact} onClick={() => onChange('zh')}>
        中文
      </LanguageTab>
      <LanguageTab active={value === 'en'} compact={compact} onClick={() => onChange('en')}>
        English
        {!hasEnglish && <span className="ml-1 text-[9px] font-normal opacity-60">待生成</span>}
      </LanguageTab>
    </div>
  );
}

function LanguageTab({
  active,
  compact,
  onClick,
  children,
}: {
  active: boolean;
  compact: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200',
        compact ? 'h-10 px-3 text-sm sm:h-7 sm:px-2.5 sm:text-[11px]' : 'h-10 px-3.5 text-sm sm:h-8 sm:text-xs',
        active
          ? 'bg-white text-[#3730a3] shadow-[0_1px_2px_rgba(15,23,42,0.08),0_0_0_1px_rgba(99,102,241,0.08)]'
          : 'text-ink-muted hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}
