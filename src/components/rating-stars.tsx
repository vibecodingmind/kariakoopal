'use client';

import { Star } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRate?: (rating: number) => void;
  showNumeric?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { icon: 'size-3.5', text: 'text-xs', gap: 'gap-0.5' },
  md: { icon: 'size-4', text: 'text-sm', gap: 'gap-1' },
  lg: { icon: 'size-5', text: 'text-base', gap: 'gap-1' },
};

export function RatingStars({
  rating,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onRate,
  showNumeric = true,
  className,
}: RatingStarsProps) {
  const [hoverRating, setHoverRating] = useState(0);
  const styles = sizeMap[size];

  const displayRating = hoverRating || rating;

  return (
    <div className={cn('flex items-center', styles.gap, className)} role={interactive ? 'radiogroup' : 'img'} aria-label={`Rating: ${rating} out of ${maxRating}`}>
      {Array.from({ length: maxRating }, (_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= Math.floor(displayRating);
        const isHalf = !isFilled && starValue - 0.5 <= displayRating;

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            className={cn(
              'relative inline-flex items-center justify-center',
              interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm'
            )}
            onClick={() => interactive && onRate?.(starValue)}
            onMouseEnter={() => interactive && setHoverRating(starValue)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            aria-label={`${starValue} star${starValue > 1 ? 's' : ''}`}
            tabIndex={interactive ? 0 : -1}
          >
            {/* Empty star (background) */}
            <Star
              className={cn(
                styles.icon,
                'text-muted-foreground/30'
              )}
            />
            {/* Filled or half star (foreground) */}
            {(isFilled || isHalf) && (
              <Star
                className={cn(
                  styles.icon,
                  'absolute inset-0 text-amber-500 fill-amber-500'
                )}
                style={
                  isHalf
                    ? { clipPath: 'inset(0 50% 0 0)' }
                    : undefined
                }
              />
            )}
          </button>
        );
      })}
      {showNumeric && (
        <span className={cn(styles.text, 'text-muted-foreground font-medium ml-1')}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
