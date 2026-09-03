import { forwardRef, useId } from 'react';
import type { TextareaHTMLAttributes, ReactNode } from 'react';
import { cx } from '../lib/cx';
import { fieldLabel, fieldBase, fieldError, fieldErrorText } from './formField';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  error?: string;
  wrapperClassName?: string;
}

/**
 * Multi-line textarea primitive with label pairing and error messaging.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, rows = 3, id, className, wrapperClassName, ...rest },
  ref
) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const errorId = error ? `${textareaId}-error` : undefined;

  return (
    <div className={cx('w-full', wrapperClassName)}>
      {label && (
        <label htmlFor={textareaId} className={fieldLabel}>
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        className={cx(fieldBase, 'block py-3 px-4 text-body resize-y', error && fieldError, className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        {...rest}
      />
      {error && (
        <p id={errorId} className={fieldErrorText}>
          {error}
        </p>
      )}
    </div>
  );
});
