'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from './cn';
import { Button } from './button';

/** 轻量模态层：替代原生 window.prompt / window.confirm，保持设计语言。
 *  内联渲染 + fixed 定位（AppShell 无 transform/filter 祖先，不会受堆叠上下文影响），
 *  避免依赖 react-dom 的 createPortal 与 @types/react 多版本类型冲突。 */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width = 'max-w-md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const onKeyDown = React.useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  React.useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onKeyDown]);

  if (!mounted || !open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/30" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative z-10 w-full rounded-lg border border-ink-line bg-white shadow-xl',
          width,
        )}
      >
        <div className="flex items-center justify-between border-b border-ink-line px-4 py-3">
          <h2 className="text-sm font-semibold tracking-tightish">{title}</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-ink-muted hover:bg-ink-panel hover:text-ink"
            aria-label="关闭"
          >
            <X size={15} />
          </button>
        </div>
        <div className="px-4 py-3">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-ink-line px-4 py-3">{footer}</div>}
      </div>
    </div>
  );
}

/** 文本输入对话框：替代 window.prompt。resolve 返回字符串或 null（取消）。 */
export function PromptDialog({
  open,
  title,
  label,
  placeholder,
  value,
  onValueChange,
  onCancel,
  onConfirm,
  confirmLabel = '确定',
}: {
  open: boolean;
  title: string;
  label: string;
  placeholder?: string;
  value: string;
  onValueChange: (v: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <Button variant="outline" onClick={onCancel}>取消</Button>
          <Button onClick={onConfirm}>{confirmLabel}</Button>
        </>
      }
    >
      <label className="block text-xs font-medium text-ink-soft mb-1.5">{label}</label>
      <input
        autoFocus
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onConfirm();
          if (e.key === 'Escape') onCancel();
        }}
        placeholder={placeholder}
        className="flex h-9 w-full rounded-md border border-ink-line bg-white px-2.5 text-sm text-ink placeholder:text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
      />
    </Modal>
  );
}

/** 确认对话框：替代 window.confirm。 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = '删除',
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <Button variant="outline" onClick={onCancel}>取消</Button>
          <Button variant="danger" onClick={onConfirm}>{confirmLabel}</Button>
        </>
      }
    >
      <p className="text-sm text-ink-soft leading-relaxed">{message}</p>
    </Modal>
  );
}