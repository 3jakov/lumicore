import type { ButtonHTMLAttributes } from 'react';

import { cn } from '@/lib/utils/cn';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
};

export function Button({
  className,
  type = 'button',
  variant = 'primary',
  ...props
}: ButtonProps): JSX.Element {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition',
        variant === 'primary' && 'bg-brand-700 text-text-inverse hover:bg-brand-800',
        variant === 'secondary' &&
          'border border-border-strong bg-surface-2 text-text-primary hover:bg-surface-1',
        variant === 'ghost' && 'text-text-secondary hover:bg-surface-2',
        className,
      )}
      {...props}
    />
  );
}
