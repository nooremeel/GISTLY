import { Link } from 'react-router-dom';
import { usePageTitle } from '../lib/usePageTitle';

export default function NotFound() {
  usePageTitle('Page not found');

  return (
    <div className="min-h-[100svh] flex flex-col items-center justify-center p-6 bg-paper text-center gap-6">
      <div className="flex flex-col gap-3">
        <p className="text-micro font-semibold uppercase tracking-widest text-accent">404</p>
        <h1 className="font-display text-h1 text-ink">Page not found.</h1>
        <p className="text-body text-muted max-w-sm">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      <Link
        to="/"
        className="inline-flex items-center justify-center h-10 px-4 rounded-md bg-ink text-paper font-medium text-body hover:brightness-90 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
      >
        Back to home
      </Link>
    </div>
  );
}
