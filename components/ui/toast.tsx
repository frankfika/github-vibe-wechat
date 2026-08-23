'use client';

import * as React from 'react';
import { Check, AlertCircle, Info, X } from 'lucide-react';
import { cn } from './cn';
import { setSaveErrorHandler } from '@/src/lib/store';

type Tone = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  tone: Tone;
  message: string;
}

interface ToastContextValue {
  push: (tone: Tone, message: string, duration?: number) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast 必须在 <ToastProvider> 内使用');
  return ctx;
}

let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const push = React.useCallback((tone: Tone, message: string, duration = 2600) => {
    const id = nextId++;
    setToasts((t) => [...t, { id, tone, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), duration);
  }, []);

  const dismiss = React.useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  // 把全局 store 的持久化失败（localStorage 爆配额）接到这里统一提示。
  React.useEffect(() => {
    const handler: (msg: string) => void = (msg) => push('error', msg);
    setSaveErrorHandler(handler);
    return () => setSaveErrorHandler(null);
  }, [push]);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 left-1/2 z-[100] flex -translate-x-1/2 flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              'pointer-events-auto flex items-center gap-2 rounded-md border px-3.5 py-2 text-sm shadow-sm',
              t.tone === 'success' && 'border-ink-line bg-white text-ink',
              t.tone === 'error' && 'border-red-200 bg-white text-red-700',
              t.tone === 'info' && 'border-ink-line bg-white text-ink-soft',
            )}
          >
            {t.tone === 'success' && <Check size={15} className="text-emerald-600 shrink-0" />}
            {t.tone === 'error' && <AlertCircle size={15} className="text-red-600 shrink-0" />}
            {t.tone === 'info' && <Info size={15} className="text-ink-muted shrink-0" />}
            <span>{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="ml-1 text-ink-muted hover:text-ink"
              aria-label="关闭"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}