import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Sparkles } from 'lucide-react';
import { cx } from '../lib/cx';

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'default' | 'compact';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Replaces label with an animated icon for AI-driven generation states. */
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
  // Explicitly resets base button border for borderless variants.
  primary: 'border-0 bg-ink text-paper hover:brightness-90 hover:shadow-sm',
  accent: 'border-0 bg-accent text-white hover:brightness-110 hover:shadow-sm',
  secondary: 'bg-surface text-ink border border-line hover:bg-line/25',
  ghost: 'border-0 bg-transparent text-muted hover:bg-accent-subtle hover:text-ink',
  destructive:
    'bg-transparent text-coral border border-coral-border hover:bg-coral hover:text-white hover:border-coral',
};

/**
 * Core button primitive providing accessible focus rings, press feedback, and variants.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'default', loading = false, disabled, className, children, type = 'button', ...rest },
  ref
) {
  if (import.meta.env.DEV) {
    const hasText =
      typeof children === 'string' ||
      typeof children === 'number' ||
      (Array.isArray(children) && children.some((c) => typeof c === 'string' || typeof c === 'number'));
    if (!hasText && !rest['aria-label'] && !rest['aria-labelledby']) {
      // eslint-disable-next-line no-console
      console.warn('Button: icon-only buttons require an accessible aria-label.');
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
