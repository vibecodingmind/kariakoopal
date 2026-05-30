'use client';

import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/stores/auth-store';
import type { Language } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface LanguageToggleProps {
  className?: string;
}

export function LanguageToggle({ className }: LanguageToggleProps) {
  const { language, setLanguage } = useAuthStore();

  const toggleLanguage = () => {
    const newLang: Language = language === 'sw' ? 'en' : 'sw';
    setLanguage(newLang);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className={cn('gap-1.5 h-8 px-2 min-w-[44px] min-h-[44px] sm:min-h-0 sm:min-w-0', className)}
      aria-label={`Switch language to ${language === 'sw' ? 'English' : 'Kiswahili'}`}
    >
      <Globe className="size-4" />
      <span className="text-xs font-semibold uppercase tracking-wide">
        {language === 'sw' ? 'SW' : 'EN'}
      </span>
    </Button>
  );
}
