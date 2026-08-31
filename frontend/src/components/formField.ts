// Shared class fragments for Input.tsx / Textarea.tsx (design system §8).
// Kept in one place so the two primitives can't drift from each other —
// they're meant to look and behave identically apart from single-line vs.
// multi-line sizing.

export const fieldLabel = 'block text-left text-small font-semibold text-ink mb-2';

// Shared by both: surface bg, line border, radius-md, ink text, faint
// placeholder, accent focus border + low-opacity ring (never border-color
// alone, per §8's explicit colorblind/contrast note).
export const fieldBase = [
  'w-full font-sans text-ink bg-surface text-left',
  'border border-line rounded-md',
  'placeholder:text-faint',
  'transition-[border-color,box-shadow] duration-150 motion-reduce:transition-none',
  'focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20',
  'disabled:opacity-50 disabled:cursor-not-allowed',
].join(' ');

export const fieldError = 'border-coral focus:border-coral focus:ring-coral/20';

export const fieldErrorText = 'mt-1 text-small text-coral';

// §8's "Paste a URL" field: Body Large text, taller field than the default
// input on the same form.
export const inputSizes = {
  default: 'h-10 px-3 text-body',
  lg: 'h-12 px-4 text-body-lg',
} as const;

export type FieldSize = keyof typeof inputSizes;
