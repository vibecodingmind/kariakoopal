import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── App Store ──

interface AppState {
  showOnboarding: boolean;
  onboardingStep: number;
  sidebarOpen: boolean;
  darkMode: boolean;
  isMobile: boolean;
  toastQueue: AppToast[];

  // Actions
  setShowOnboarding: (show: boolean) => void;
  setOnboardingStep: (step: number) => void;
  nextOnboardingStep: () => void;
  completeOnboarding: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setDarkMode: (dark: boolean) => void;
  toggleDarkMode: () => void;
  setIsMobile: (mobile: boolean) => void;
  addToast: (toast: Omit<AppToast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export interface AppToast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      showOnboarding: true,
      onboardingStep: 0,
      sidebarOpen: false,
      darkMode: false,
      isMobile: false,
      toastQueue: [],

      setShowOnboarding: (show) => set({ showOnboarding: show }),

      setOnboardingStep: (step) => set({ onboardingStep: step }),

      nextOnboardingStep: () =>
        set((state) => ({ onboardingStep: state.onboardingStep + 1 })),

      completeOnboarding: () =>
        set({ showOnboarding: false, onboardingStep: 0 }),

      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      setDarkMode: (dark) => set({ darkMode: dark }),

      toggleDarkMode: () =>
        set((state) => ({ darkMode: !state.darkMode })),

      setIsMobile: (mobile) => set({ isMobile: mobile }),

      addToast: (toast) =>
        set((state) => ({
          toastQueue: [
            ...state.toastQueue,
            { ...toast, id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` },
          ],
        })),

      removeToast: (id) =>
        set((state) => ({
          toastQueue: state.toastQueue.filter((t) => t.id !== id),
        })),

      clearToasts: () => set({ toastQueue: [] }),
    }),
    {
      name: 'kariako-app',
      partialize: (state) => ({
        showOnboarding: state.showOnboarding,
        onboardingStep: state.onboardingStep,
        darkMode: state.darkMode,
      }),
    }
  )
);
