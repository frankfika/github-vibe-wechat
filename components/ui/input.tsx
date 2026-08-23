'use client';

import * as React from 'react';
import { cn } from './cn';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex h-8 w-full rounded-md border border-ink-line bg-white px-2.5 text-sm text-ink placeholder:text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex w-full rounded-md border border-ink-line bg-white px-2.5 py-2 text-sm text-ink placeholder:text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink',
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';
