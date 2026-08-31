'use client';

import * as React from 'react';
import { MessageSquareText, X } from 'lucide-react';
import { QuickComposer } from './QuickComposer';

type CreationLauncherContextValue = { openCreationLauncher: () => void };

const CreationLauncherContext = React.createContext<CreationLauncherContextValue | null>(null);

export function CreationLauncherProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);
  const close = React.useCallback(() => setOpen(false), []);
  const openCreationLauncher = React.useCallback(() => setOpen(true), []);

  React.useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [close, open]);

  return (
    <CreationLauncherContext.Provider value={{ openCreationLauncher }}>
      {children}
      {open && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-slate-950/35 p-0 backdrop-blur-sm sm:items-center sm:p-6" onMouseDown={close}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="creation-launcher-title"
            className="w-full max-w-3xl rounded-t-3xl border border-white/80 bg-[#f8f9ff]/95 p-4 shadow-[0_28px_100px_rgba(15,23,42,0.28)] sm:rounded-3xl sm:p-6"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start gap-4 px-1">
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-700"><MessageSquareText size={13}/> 新建内容</div>
                <h2 id="creation-launcher-title" className="text-xl font-bold tracking-tightish text-ink">把素材放进来</h2>
                <p className="mt-1 text-sm text-ink-muted">主题、正文、多个网页或 GitHub 仓库都可以。</p>
              </div>
              <button ref={closeButtonRef} type="button" onClick={close} aria-label="关闭创作窗口" className="flex size-10 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-white hover:text-ink">
                <X size={18}/>
              </button>
            </div>
            <QuickComposer compact onComplete={close}/>
          </section>
        </div>
      )}
    </CreationLauncherContext.Provider>
  );
}

export function useCreationLauncher(): CreationLauncherContextValue {
  const context = React.useContext(CreationLauncherContext);
  if (!context) throw new Error('useCreationLauncher must be used inside CreationLauncherProvider');
  return context;
}
