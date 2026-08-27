import { Plus } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  variant: 'library' | 'search' | 'tag' | 'collection';
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

export default function EmptyState({ variant }: EmptyStateProps) {
  const content = CONTENT[variant];

  const handleAddBookmark = () => {
    document.getElementById('add-bookmark')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // Attempt to focus the URL input after scrolling
    setTimeout(() => {
      document.getElementById('bookmark-url')?.focus();
    }, 300);
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-24 gap-4 text-center px-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-h1 font-semibold text-ink font-display tracking-tight">
          {content.headline}
        </h2>
        <p className="text-body-lg text-muted max-w-md mx-auto">
          {content.subtext}
        </p>
      </div>
      
      {variant === 'library' && (
        <div className="mt-4">
          <Button variant="primary" onClick={handleAddBookmark}>
            <Plus className="size-4" aria-hidden="true" />
            Add your first bookmark
          </Button>
        </div>
      )}
    </div>
  );
}
