import { Sparkles } from 'lucide-react';
import { cx } from '../lib/cx';

export interface GistProps {
  /** AI summary text. Renders null if absent adhering to the fail-soft contract. */
  summary: string | null | undefined;
  /** Plays fade-and-expand entrance animation when resolving from processing state. */
  animate?: boolean;
  className?: string;
}

/**
 * AI Gist component displaying summarized key takeaways.
 * Fails softly by rendering null when summary content is unavailable.
 */
export default function Gist({ summary, animate = false, className }: GistProps) {
  // Fail-soft: suppress rendering when summary content is missing.
  if (!summary) return null;

  return (
    <div
      className={cx(
        'rounded-md bg-lime-wash mt-4',
        animate ? 'animate-gist-enter' : 'p-4',
        className
      )}
    >
      <div className="mb-1 flex items-center gap-1">
        <Sparkles className="size-3 text-accent" aria-hidden="true" />
        <span className="text-micro font-medium uppercase tracking-[0.06em] text-accent">
          Gist
        </span>
      </div>

      <p className="text-body text-ink">{summary}</p>
    </div>
  );
}
