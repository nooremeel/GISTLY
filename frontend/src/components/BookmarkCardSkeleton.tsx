/**
 * Skeleton placeholder mirroring BookmarkCard geometry to prevent layout shift during initial list loading.
 */

function SkeletonBar({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-sm animate-shimmer ${className ?? ''}`}
      aria-hidden="true"
    />
  );
}

export default function BookmarkCardSkeleton() {
  return (
    <div
      className="rounded-lg border border-line bg-surface p-4 md:p-6"
      aria-hidden="true"
    >
      <SkeletonBar className="h-3 w-1/4 mb-5" />

      <SkeletonBar className="h-5 w-3/4 mb-2" />
      <SkeletonBar className="h-5 w-1/2 mb-6" />

      <div className="rounded-md bg-lime-wash p-4 mb-6">
        <SkeletonBar className="h-3 w-16 mb-3" />
        <SkeletonBar className="h-4 w-full mb-2" />
        <SkeletonBar className="h-4 w-5/6" />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2">
          <SkeletonBar className="h-5 w-14 rounded-sm" />
          <SkeletonBar className="h-5 w-16 rounded-sm" />
          <SkeletonBar className="h-5 w-12 rounded-sm" />
        </div>
        <SkeletonBar className="h-3 w-10" />
      </div>
    </div>
  );
}
