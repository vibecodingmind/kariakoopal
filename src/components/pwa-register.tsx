'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Download, X } from 'lucide-react';

// Bilingual strings for the install banner
const strings = {
  sw: {
    installTitle: 'Sakinisha Chimbo Direct',
    installDesc: 'Tumia kama programu kwenye simu yako kwa urahisi zaidi',
    installButton: 'Sakinisha',
    dismissButton: 'Si dakika hii',
  },
  en: {
    installTitle: 'Install Chimbo Direct',
    installDesc: 'Use as an app on your phone for a better experience',
    installButton: 'Install',
    dismissButton: 'Not now',
  },
} as const;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWARegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const language = useAuthStore((s) => s.language);
  const t = strings[language] || strings.sw;

  // Register service worker on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.error('[PWA] Service Worker registration failed:', error);
        });
    }
  }, []);

  // Listen for beforeinstallprompt event
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handler = (e: Event) => {
      // Prevent the default mini-infobar
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Also listen for appinstalled to hide the banner
    const installedHandler = () => {
      setShowBanner(false);
      setDeferredPrompt(null);
      console.log('[PWA] App installed successfully');
    };

    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('[PWA] Install prompt outcome:', outcome);
    } catch (error) {
      console.error('[PWA] Install prompt error:', error);
    } finally {
      setDeferredPrompt(null);
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
  };

  // Don't render anything if banner shouldn't show
  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-4 duration-300">
      <div className="mx-auto max-w-lg rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/80 dark:border-amber-800 p-4 shadow-lg backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-amber-500 text-white">
            <Download className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100">
              {t.installTitle}
            </h3>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
              {t.installDesc}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Button
                size="sm"
                onClick={handleInstall}
                className="bg-amber-600 hover:bg-amber-700 text-white h-8 px-3 text-xs"
              >
                <Download className="size-3.5 mr-1" />
                {t.installButton}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900 h-8 px-3 text-xs"
              >
                {t.dismissButton}
              </Button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-amber-500 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-200 transition-colors"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
