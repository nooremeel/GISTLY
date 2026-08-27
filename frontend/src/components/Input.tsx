import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { cx } from '../lib/cx';
import { fieldLabel, fieldBase, fieldError, fieldErrorText, inputSizes } from './formField';
import type { FieldSize } from './formField';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Rendered above the field (Small, 600 weight, ink) — preserves the
   * existing label/input pairing pattern rather than floating labels
   * (explicitly ruled out by §8). Omit if you're pairing your own
   * `<label htmlFor>` elsewhere. */
  label?: ReactNode;
  /** Inline validation message (Small, coral) shown below the field, and
   * flips the field's border to coral. Omit when the field is valid. */
  error?: string;
  /** `default` for most fields; `lg` for the primary "Paste a URL" field on
   * the bookmark-creation form (§8), which is Body Large and taller than
   * everything else on that form. Named `sizeVariant` (not `size`) because
   * `size` is already a native `<input>` HTML attribute (number of visible
   * characters) — keeping both would collide. */
  sizeVariant?: FieldSize;
  /** Optional leading icon — the one exception §8 carves out of "no
   * inline icon-in-input clutter", reserved for the search field's leading
   * search icon. */
  leadingIcon?: ReactNode;
  wrapperClassName?: string;
}

/**
 * Single-line text input primitive (design system §8). Pure presentational
 * — validation/submission stays with the consuming form.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, sizeVariant = 'default', leadingIcon, id, className, wrapperClassName, ...rest },
  ref
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className={cx('w-full', wrapperClassName)}>
      {label && (
        <label htmlFor={inputId} className={fieldLabel}>
          {label}
        </label>
      )}
      <div className="relative">
        {leadingIcon && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-faint">
            {leadingIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cx(
            fieldBase,
            inputSizes[sizeVariant],
            leadingIcon ? 'pl-9' : null,
            error ? fieldError : null,
            className
          )}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          {...rest}
        />
      </div>
      {error && (
        <p id={errorId} className={fieldErrorText}>
          {error}
        </p>
      )}
    </div>
  );
});
