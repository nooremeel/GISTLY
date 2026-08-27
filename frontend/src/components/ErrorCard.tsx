import { AlertCircle } from 'lucide-react';
import { Button } from './Button';

export interface ErrorCardProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorCard({ message, onRetry }: ErrorCardProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 gap-4 text-center bg-surface border border-coral-border rounded-lg shadow-sm">
      <div className="flex items-center justify-center size-12 rounded-full bg-coral/10 mb-2">
        <AlertCircle className="size-6 text-coral" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-h3 font-semibold text-ink">Something went wrong</h3>
        <p className="text-body text-muted max-w-sm">{message}</p>
      </div>
      {onRetry && (
        <div className="mt-2">
          <Button variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}
