import type { HTMLAttributes } from 'react';
import { cx } from '../lib/cx';

export type BadgeVariant = 'neutral' | 'success' | 'error';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const base = 'inline-flex items-center rounded-sm px-2 py-1 text-small font-medium';

const variantStyles: Record<BadgeVariant, string> = {
  neutral: 'bg-line/25 text-muted',
  success: 'bg-lime text-ink',
  error: 'bg-coral text-ink',
};

/**
 * Status and category badge indicator.
 */
export function Badge({ variant = 'neutral', className, children, ...rest }: BadgeProps) {
  return (
    <span className={cx(base, variantStyles[variant], className)} {...rest}>
      {children}
    </span>
  );
}
