function SkeletonBox({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-[#0A1628] rounded animate-pulse ${className}`}
    />
  );
}

function CardSkeleton() {
  return (
    <div className="bg-[#0A1628] border border-[#1E3A5F] rounded-2xl p-5 space-y-4">
      <div className="flex justify-between">
        <SkeletonBox className="h-4 w-16" />
        <SkeletonBox className="h-4 w-20" />
      </div>
      <SkeletonBox className="h-6 w-3/4" />
      <SkeletonBox className="h-4 w-full" />
      <SkeletonBox className="h-4 w-5/6" />
      <SkeletonBox className="h-4 w-full" />
      <SkeletonBox className="h-4 w-4/5" />
    </div>
  );
}

export default function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Trend card skeleton */}
      <div className="bg-[#0A1628] border border-[#1E3A5F] rounded-2xl p-6 space-y-4">
        <div className="flex gap-2">
          <SkeletonBox className="h-5 w-40" />
          <SkeletonBox className="h-5 w-16 ml-auto" />
        </div>
        <div className="flex gap-2">
          <SkeletonBox className="h-7 w-20 rounded-full" />
          <SkeletonBox className="h-7 w-24 rounded-full" />
          <SkeletonBox className="h-7 w-16 rounded-full" />
        </div>
        <SkeletonBox className="h-4 w-full" />
        <SkeletonBox className="h-4 w-5/6" />
        <SkeletonBox className="h-4 w-4/5" />
      </div>

      {/* Ad copy cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
