import { Plus } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  variant: 'library' | 'search' | 'tag' | 'collection';
  /**
   * Callback for the "Add your first bookmark" button shown on the
   * `library` variant. Replaces the old DOM scroll-to-form approach —
   * the inline form no longer exists; the caller now opens the modal.
   */
  onAdd?: () => void;
}

const CONTENT = {
  library: {
    headline: 'Nothing saved yet.',
    subtext: 'Start collecting the things future-you will thank you for.',
  },
  search: {
    headline: 'No useful matches yet.',
    subtext: 'Try a different phrase or search by tag.',
  },
  tag: {
    headline: 'Nothing lives here yet.',
    subtext: "Save something with this tag and it'll appear here.",
  },
  collection: {
    headline: 'This collection is empty.',
    subtext: 'Bookmarks you assign here will show up.',
  },
};

export default function EmptyState({ variant, onAdd }: EmptyStateProps) {
  const content = CONTENT[variant];

  return (
    <div className="animate-fade-in flex flex-col items-center justify-center py-16 sm:py-24 gap-4 text-center px-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-h1 font-semibold text-ink font-display tracking-tight">
          {content.headline}
        </h2>
        <p className="text-body-lg text-muted max-w-md mx-auto">
          {content.subtext}
        </p>
      </div>
      
      {variant === 'library' && onAdd && (
        <div className="mt-4">
          <Button variant="primary" onClick={onAdd}>
            <Plus className="size-4" aria-hidden="true" />
            Add your first bookmark
          </Button>
        </div>
      )}
    </div>
  );
}
