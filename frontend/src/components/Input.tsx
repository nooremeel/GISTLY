import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { cx } from '../lib/cx';
import { fieldLabel, fieldBase, fieldError, fieldErrorText, inputSizes } from './formField';
import type { FieldSize } from './formField';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  error?: string;
  /** Named `sizeVariant` to avoid collision with native HTML `<input size>` attribute. */
  sizeVariant?: FieldSize;
  leadingIcon?: ReactNode;
  wrapperClassName?: string;
}

/**
 * Text input primitive with label pairing, error messaging, and icon adornment.
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
