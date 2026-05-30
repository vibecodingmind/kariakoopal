'use client';

import { MapPin, ShieldCheck, TrendingUp, ArrowRight } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useAppStore } from '@/lib/stores/app-store';
import { t, type Language } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useCallback, useEffect, useState } from 'react';

interface OnboardingProps {
  className?: string;
}

interface OnboardScreen {
  icon: React.ElementType;
  iconGradient: string;
  titleKey: string;
  descKey: string;
}

const screens: OnboardScreen[] = [
  {
    icon: MapPin,
    iconGradient: 'from-emerald-400 to-teal-500',
    titleKey: 'onboard_1_title',
    descKey: 'onboard_1_desc',
  },
  {
    icon: TrendingUp,
    iconGradient: 'from-amber-400 to-orange-500',
    titleKey: 'onboard_2_title',
    descKey: 'onboard_2_desc',
  },
  {
    icon: ShieldCheck,
    iconGradient: 'from-sky-400 to-indigo-500',
    titleKey: 'onboard_3_title',
    descKey: 'onboard_3_desc',
  },
];

export function Onboarding({ className }: OnboardingProps) {
  const language = useAuthStore((s) => s.language) as Language;
  const { completeOnboarding, showOnboarding } = useAppStore();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  const onSelect = useCallback(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
  }, [api]);

  useEffect(() => {
    if (!api) return;
    api.on('select', onSelect);
    return () => {
      api.off('select', onSelect);
    };
  }, [api, onSelect]);

  if (!showOnboarding) return null;

  const isLast = current === screens.length - 1;

  return (
    <div className={cn('fixed inset-0 z-50 flex flex-col', className)}>
      {/* Skip button */}
      {!isLast && (
        <div className="flex justify-end p-4">
          <button
            onClick={completeOnboarding}
            className="glass px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground hover:bg-[var(--glass-hover)] transition-colors"
          >
            {t('cancel', language)}
          </button>
        </div>
      )}

      {/* Carousel */}
      <div className="flex-1 flex items-center justify-center px-6">
        <Carousel setApi={setApi} className="w-full max-w-sm" opts={{ loop: false }}>
          <CarouselContent>
            {screens.map((screen, idx) => {
              const Icon = screen.icon;
              return (
                <CarouselItem key={idx}>
                  <div className="flex flex-col items-center text-center gap-6 py-8">
                    {/* Floating icon */}
                    <div className="animate-float">
                      <div className={cn(
                        'size-28 rounded-3xl glass-card flex items-center justify-center',
                        idx === 0 && 'amber-glow-sm',
                        idx === 1 && 'amber-glow-sm',
                      )}>
                        <div className={cn(
                          'w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center',
                          screen.iconGradient
                        )}>
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-bold gradient-text px-4">
                      {t(screen.titleKey, language)}
                    </h2>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground leading-relaxed px-4 max-w-xs">
                      {t(screen.descKey, language)}
                    </p>
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>
      </div>

      {/* Bottom section: dots + button */}
      <div className="p-6 pb-8 flex flex-col items-center gap-4">
        {/* Progress dots */}
        <div className="flex gap-2">
          {screens.map((_, idx) => (
            <button
              key={idx}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                idx === current
                  ? 'w-6 glass-button !rounded-full !h-2 !p-0'
                  : 'w-2 glass !rounded-full'
              )}
              onClick={() => api?.scrollTo(idx)}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Action button */}
        <button
          onClick={() => {
            if (isLast) {
              completeOnboarding();
            } else {
              api?.scrollNext();
            }
          }}
          className="glass-button w-full max-w-sm h-12 flex items-center justify-center gap-2 text-base"
        >
          {isLast ? t('get_started', language) : t('next', language)}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
