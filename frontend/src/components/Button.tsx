import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Sparkles } from 'lucide-react';
import { cx } from '../lib/cx';

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'default' | 'compact';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual treatment — see design system §7. Defaults to `primary`. */
  variant?: ButtonVariant;
  /** `default` = 40px/radius-md, `compact` = 32px/radius-sm for inline card actions. */
  size?: ButtonSize;
  /**
   * AI-forward loading state: replaces the label with the pulsing Gist-mark
   * motif (§7/§16) instead of a generic spinner. Reserved for AI-triggering
   * actions (e.g. "Add Bookmark" while the summary is generating) — for
   * plain async actions (Login, Save edit, Delete) prefer swapping the
   * children text yourself and just passing `disabled`, per §16's "Button
   * loading" note.
   */
  loading?: boolean;
  children?: ReactNode;
}

const base = [
  'inline-flex items-center justify-center gap-1',
  'font-sans text-body font-medium',
  'transition-[background-color,color,border-color,box-shadow,transform]',
  'duration-150 motion-reduce:transition-none',
  'active:scale-[0.98] active:duration-100 disabled:active:scale-100',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper',
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
].join(' ');

const sizeStyles: Record<ButtonSize, string> = {
  default: 'h-10 px-4 rounded-md',
  compact: 'h-8 px-3 rounded-sm text-small',
};

const variantStyles: Record<ButtonVariant, string> = {
  // border-0 is explicit (not just "omit a border utility") because the
  // base layer still carries the placeholder <button> rule's 1px border
  // for any raw button elsewhere in the app (see index.css) — Primary/
  // Accent/Ghost need to actively override it to get §7's "border: none".
  primary: 'border-0 bg-ink text-paper hover:brightness-90 hover:shadow-sm',
  accent: 'border-0 bg-accent text-white hover:brightness-110 hover:shadow-sm',
  secondary: 'bg-surface text-ink border border-line hover:bg-line/25',
  ghost: 'border-0 bg-transparent text-muted hover:bg-accent-subtle hover:text-ink',
  destructive:
    'bg-transparent text-coral border border-coral-border hover:bg-coral hover:text-white hover:border-coral',
};

/**
 * Core button primitive (design system §7). Pure presentational — no data
 * fetching, no form logic. Every variant carries the same focus-visible
 * ring, disabled treatment, and press animation; only background/text/
 * border differ.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'default', loading = false, disabled, className, children, type = 'button', ...rest },
  ref
) {
  if (import.meta.env.DEV) {
    const isTextlike = typeof children === 'string' || typeof children === 'number';
    if (!isTextlike && !rest['aria-label'] && !rest['aria-labelledby']) {
      // eslint-disable-next-line no-console
      console.warn(
        'Button: icon-only buttons need an aria-label (design system §22 — every icon-only button must have an accessible name).'
      );
    }
  }

  return (
    <button
      ref={ref}
      type={type}
      className={cx(base, sizeStyles[size], variantStyles[variant], className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <Sparkles
          className="size-4 animate-pulse motion-reduce:animate-none"
          aria-hidden="true"
        />
      ) : (
        children
      )}
    </button>
  );
});
