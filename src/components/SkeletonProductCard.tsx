import React from 'react';

interface SkeletonProductCardProps {
  variant?: 'grid' | 'list';
}

export function SkeletonProductCard({ variant = 'grid' }: SkeletonProductCardProps) {
  if (variant === 'list') {
    return (
      <div className="flex gap-4 bg-card rounded-xl border border-border p-3 sm:p-4">
        {/* Image */}
        <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-lg bg-muted animate-pulse flex-shrink-0" />

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          {/* Category */}
          <div className="h-3 w-16 bg-muted rounded-md animate-pulse" />
          {/* Name */}
          <div className="h-4 w-3/4 bg-muted rounded-md animate-pulse" />
          {/* Description line 1 */}
          <div className="h-3 w-full bg-muted rounded-md animate-pulse" />
          {/* Description line 2 */}
          <div className="h-3 w-2/3 bg-muted rounded-md animate-pulse" />
          {/* Rating */}
          <div className="h-3.5 w-20 bg-muted rounded-md animate-pulse" />

          <div className="flex-1" />

          {/* Price + button row */}
          <div className="flex items-end justify-between gap-2">
            <div className="h-6 w-20 bg-muted rounded-md animate-pulse" />
            <div className="h-9 w-24 bg-muted rounded-md animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Grid variant
  return (
    <div className="bg-card rounded-xl overflow-hidden border border-border flex flex-col h-full">
      {/* Image area */}
      <div className="aspect-square bg-muted animate-pulse" />

      {/* Info */}
      <div className="p-3 sm:p-4 flex flex-col flex-1 gap-2">
        {/* Category */}
        <div className="h-3 w-16 bg-muted rounded-md animate-pulse" />
        {/* Name line 1 */}
        <div className="h-4 w-full bg-muted rounded-md animate-pulse" />
        {/* Name line 2 */}
        <div className="h-4 w-2/3 bg-muted rounded-md animate-pulse" />
        {/* Rating */}
        <div className="h-3.5 w-20 bg-muted rounded-md animate-pulse" />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Price + cart button */}
        <div className="flex items-end justify-between gap-2 pt-1">
          <div className="flex flex-col gap-1">
            <div className="h-3 w-12 bg-muted rounded-md animate-pulse" />
            <div className="h-6 w-16 bg-muted rounded-md animate-pulse" />
          </div>
          <div className="w-10 h-10 bg-muted rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}

interface SkeletonProductGridProps {
  count?: number;
  variant?: 'grid' | 'list';
}

export function SkeletonProductGrid({ count = 8, variant = 'grid' }: SkeletonProductGridProps) {
  const items = Array.from({ length: count }, (_, i) => (
    <SkeletonProductCard key={i} variant={variant} />
  ));

  if (variant === 'list') {
    return <div className="flex flex-col gap-3">{items}</div>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
      {items}
    </div>
  );
}
