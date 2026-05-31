export default function Loading() {
  return (
    <div className="px-4 py-8 space-y-5">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="shimmer h-8 w-48 rounded-lg" />
        <div className="shimmer h-4 w-72 rounded" />
      </div>

      {/* Search skeleton */}
      <div className="shimmer h-12 w-full rounded-xl" />

      {/* Chips skeleton */}
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="shimmer h-8 w-20 rounded-full" />
        ))}
      </div>

      {/* Card skeletons */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="shimmer h-24 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
