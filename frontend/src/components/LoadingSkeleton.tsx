import React from 'react';

export const LoadingSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top banner skeleton */}
      <div className="bg-orbit-surface border border-orbit-border rounded-xl p-6 space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-3 w-2/3">
            <div className="h-6 bg-orbit-subtle rounded w-1/2" />
            <div className="h-4 bg-orbit-subtle rounded w-3/4" />
            <div className="flex gap-2">
              <div className="h-6 w-20 bg-orbit-subtle rounded" />
              <div className="h-6 w-20 bg-orbit-subtle rounded" />
              <div className="h-6 w-24 bg-orbit-subtle rounded" />
            </div>
          </div>
          <div className="flex flex-col gap-2 w-32">
            <div className="h-8 bg-orbit-subtle rounded" />
            <div className="h-8 bg-orbit-subtle rounded" />
          </div>
        </div>
      </div>

      {/* Metric Tiles Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-orbit-surface border border-orbit-border rounded-xl p-4 space-y-2">
            <div className="h-3 bg-orbit-subtle rounded w-1/3" />
            <div className="h-7 bg-orbit-subtle rounded w-1/2" />
            <div className="h-2 bg-orbit-subtle rounded w-2/3" />
          </div>
        ))}
      </div>

      {/* Health Card Skeleton */}
      <div className="bg-orbit-surface border border-orbit-border rounded-xl p-6 space-y-4">
        <div className="h-5 bg-orbit-subtle rounded w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div className="h-20 bg-orbit-subtle rounded-lg" />
          <div className="h-20 bg-orbit-subtle rounded-lg" />
        </div>
      </div>
    </div>
  );
};
