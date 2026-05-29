'use client';

import { MapPin, ShieldCheck, TrendingUp, ArrowRight } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
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
  iconBg: string;
  iconColor: string;
  titleKey: string;
  descKey: string;
}

const screens: OnboardScreen[] = [
  {
    icon: MapPin,
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/50',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    titleKey: 'onboard_1_title',
    descKey: 'onboard_1_desc',
  },
  {
    icon: TrendingUp,
    iconBg: 'bg-amber-50 dark:bg-amber-950/50',
    iconColor: 'text-amber-600 dark:text-amber-400',
    titleKey: 'onboard_2_title',
    descKey: 'onboard_2_desc',
  },
  {
    icon: ShieldCheck,
    iconBg: 'bg-sky-50 dark:bg-sky-950/50',
    iconColor: 'text-sky-600 dark:text-sky-400',
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
    <div className={cn('fixed inset-0 z-50 bg-background flex flex-col', className)}>
      {/* Skip button */}
      {!isLast && (
        <div className="flex justify-end p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={completeOnboarding}
            className="text-muted-foreground"
          >
            {t('cancel', language)}
          </Button>
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
                    {/* Icon illustration */}
                    <div
                      className={cn(
                        'size-28 rounded-3xl flex items-center justify-center',
                        screen.iconBg
                      )}
                    >
                      <Icon className={cn('size-14', screen.iconColor)} />
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-bold text-foreground px-4">
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
                  ? 'w-6 bg-primary'
                  : 'w-2 bg-muted-foreground/30'
              )}
              onClick={() => api?.scrollTo(idx)}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Action button */}
        <Button
          size="lg"
          className="w-full max-w-sm h-12 text-base"
          onClick={() => {
            if (isLast) {
              completeOnboarding();
            } else {
              api?.scrollNext();
            }
          }}
        >
          {isLast ? t('get_started', language) : t('next', language)}
          <ArrowRight className="size-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
