'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { t, type Language } from '@/lib/i18n';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Loader2 } from 'lucide-react';

// ── Types ──

export interface SocialLoginProps {
  language?: 'sw' | 'en';
  onGoogleLogin?: () => void;
  onFacebookLogin?: () => void;
  onAppleLogin?: () => void;
  isLoading?: boolean;
}

// ── Component ──

export function SocialLogin({
  language: propLanguage,
  onGoogleLogin,
  onFacebookLogin,
  onAppleLogin,
  isLoading = false,
}: SocialLoginProps) {
  const storeLanguage = useAuthStore((s) => s.language) as Language;
  const language = propLanguage || storeLanguage;
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'facebook' | 'apple' | null>(null);

  const handleLogin = (provider: 'google' | 'facebook' | 'apple', callback?: () => void) => {
    if (isLoading) return;
    setLoadingProvider(provider);
    // Simulate a brief loading state then call the callback
    setTimeout(() => {
      callback?.();
      setLoadingProvider(null);
    }, 600);
  };

  return (
    <div className="w-full space-y-4">
      {/* Social buttons */}
      <div className="flex gap-3">
        {/* Google */}
        <button
          onClick={() => handleLogin('google', onGoogleLogin)}
          disabled={isLoading || loadingProvider !== null}
          className={cn(
            'flex-1 glass-card gradient-border rounded-xl py-3 px-4 flex items-center justify-center gap-2.5',
            'transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0',
            'group'
          )}
        >
          {loadingProvider === 'google' ? (
            <Loader2 className="size-5 animate-spin text-gray-600 dark:text-gray-300" />
          ) : (
            <div className="size-7 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <span className="text-sm font-bold bg-gradient-to-r from-blue-500 via-red-500 to-yellow-500 bg-clip-text text-transparent">
                G
              </span>
            </div>
          )}
          <span className="text-sm font-medium text-foreground">
            {t('sign_in_google', language)}
          </span>
        </button>

        {/* Facebook */}
        <button
          onClick={() => handleLogin('facebook', onFacebookLogin)}
          disabled={isLoading || loadingProvider !== null}
          className={cn(
            'flex-1 glass-card gradient-border rounded-xl py-3 px-4 flex items-center justify-center gap-2.5',
            'bg-blue-500/5 dark:bg-blue-500/10',
            'transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:bg-blue-500/10 dark:hover:bg-blue-500/20',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0',
            'group'
          )}
        >
          {loadingProvider === 'facebook' ? (
            <Loader2 className="size-5 animate-spin text-blue-500" />
          ) : (
            <div className="size-7 rounded-full bg-blue-600 dark:bg-blue-700 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <span className="text-sm font-bold text-white">f</span>
            </div>
          )}
          <span className="text-sm font-medium text-foreground">
            {t('sign_in_facebook', language)}
          </span>
        </button>

        {/* Apple */}
        <button
          onClick={() => handleLogin('apple', onAppleLogin)}
          disabled={isLoading || loadingProvider !== null}
          className={cn(
            'flex-1 glass-card gradient-border rounded-xl py-3 px-4 flex items-center justify-center gap-2.5',
            'bg-gray-900/5 dark:bg-gray-100/5',
            'transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:bg-gray-900/10 dark:hover:bg-gray-100/10',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0',
            'group'
          )}
        >
          {loadingProvider === 'apple' ? (
            <Loader2 className="size-5 animate-spin text-foreground" />
          ) : (
            <div className="size-7 rounded-full bg-gray-900 dark:bg-gray-100 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              {/* Simple Apple SVG icon */}
              <svg
                viewBox="0 0 24 24"
                className="size-4 text-white dark:text-gray-900"
                fill="currentColor"
              >
                <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 16.56 2.93 11.3 4.7 7.72C5.57 5.94 7.36 4.86 9.28 4.84C10.56 4.81 11.78 5.72 12.57 5.72C13.36 5.72 14.85 4.62 16.4 4.8C17.06 4.83 18.89 5.08 20.06 6.78C19.95 6.85 17.62 8.24 17.65 11.1C17.69 14.52 20.57 15.63 20.6 15.64C20.57 15.73 20.12 17.32 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" />
              </svg>
            </div>
          )}
          <span className="text-sm font-medium text-foreground">
            {t('sign_in_apple', language)}
          </span>
        </button>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border/50" />
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          {t('or_divider', language)}
        </span>
        <div className="flex-1 h-px bg-border/50" />
      </div>
    </div>
  );
}
