import type { HTMLAttributes } from 'react';
import { cx } from '../lib/cx';

export type BadgeVariant = 'neutral' | 'success' | 'error';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /**
   * `neutral` (default) is the collection badge from §12 — muted text on a
   * faint neutral background, deliberately shaped differently from `Tag`
   * (no border) so the two are never confused.
   * `success`/`error` follow §2's semantic mapping (lime+ink / coral) for
   * "processed" badges and similar status labels.
   */
  variant?: BadgeVariant;
}

const base = 'inline-flex items-center rounded-sm px-2 py-1 text-small font-medium';

const variantStyles: Record<BadgeVariant, string> = {
  neutral: 'bg-line/25 text-muted',
  success: 'bg-lime text-ink',
  error: 'bg-coral text-ink',
};

/**
 * Badge primitive (design system §12 collection badge, §2 semantic
 * mapping). Distinct from `Tag`: no border, rectangle-ish rather than
 * pill-ish shape, and never carries a `#` prefix.
 */
export function Badge({ variant = 'neutral', className, children, ...rest }: BadgeProps) {
  return (
    <span className={cx(base, variantStyles[variant], className)} {...rest}>
      {children}
    </span>
  );
}
