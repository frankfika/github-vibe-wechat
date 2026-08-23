'use client';

import * as React from 'react';
import { cn } from './cn';

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'flex h-8 w-full rounded-md border border-ink-line bg-white px-2 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
);
Select.displayName = 'Select';
