import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Language } from '@/lib/i18n';

// ── TypeScript Interfaces (matching Prisma schema) ──

export interface User {
  id: string;
  phone: string;
  email?: string | null;
  name: string;
  role: 'seeker' | 'guide' | 'admin';
  languagePref: 'sw' | 'en';
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GuideProfile {
  id: string;
  userId: string;
  bio: string;
  idDocumentUrl: string | null;
  status: 'pending' | 'active' | 'suspended';
  zones: string[]; // parsed from JSON
  languages: string[]; // parsed from JSON
  avgRating: number;
  totalSessions: number;
  isOnline: boolean;
  currentStatus: 'online' | 'offline' | 'busy';
  createdAt: string;
  updatedAt: string;
}

export interface Badge {
  id: string;
  guideId: string;
  badgeType: string;
  awardedAt: string;
}

// ── Auth Store ──

interface AuthState {
  user: User | null;
  guideProfile: GuideProfile | null;
  badges: Badge[];
  isAuthenticated: boolean;
  language: Language;
  currentView: string;
  isLoading: boolean;

  // Actions
  login: (phone: string, role?: string, name?: string) => Promise<void>;
  socialLogin: (provider: string, providerId: string, email: string, name: string, avatarUrl?: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setGuideProfile: (profile: GuideProfile | null) => void;
  setBadges: (badges: Badge[]) => void;
  setLanguage: (lang: Language) => void;
  setView: (view: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      guideProfile: null,
      badges: [],
      isAuthenticated: false,
      language: 'sw',
      currentView: 'home',
      isLoading: false,

      login: async (phone: string, role?: string, name?: string) => {
        set({ isLoading: true });
        try {
          const res = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, role, name }),
          });

          if (!res.ok) {
            throw new Error('Login failed');
          }

          const data = await res.json();

          set({
            user: data.user,
            guideProfile: data.guideProfile || null,
            badges: data.badges || [],
            isAuthenticated: true,
            language: (data.user?.languagePref as Language) || 'sw',
            currentView: data.user?.role === 'admin' ? 'admin' : 'home',
            isLoading: false,
          });
        } catch {
          set({ isLoading: false });
          throw new Error('Login failed');
        }
      },

      socialLogin: async (provider: string, providerId: string, email: string, name: string, avatarUrl?: string) => {
        set({ isLoading: true });
        try {
          const res = await fetch('/api/auth/social', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider, providerId, email, name, avatarUrl }),
          });

          if (!res.ok) {
            throw new Error('Social login failed');
          }

          const data = await res.json();

          set({
            user: data.user,
            isAuthenticated: true,
            language: (data.user?.languagePref as Language) || 'sw',
            currentView: data.user?.role === 'admin' ? 'admin' : 'home',
            isLoading: false,
          });
        } catch {
          set({ isLoading: false });
          throw new Error('Social login failed');
        }
      },

      logout: () => {
        set({
          user: null,
          guideProfile: null,
          badges: [],
          isAuthenticated: false,
          currentView: 'auth',
        });
      },

      setUser: (user) =>
        set({ user, isAuthenticated: true, language: (user.languagePref as Language) || 'sw' }),

      setGuideProfile: (profile) => set({ guideProfile: profile }),

      setBadges: (badges) => set({ badges }),

      setLanguage: (lang) =>
        set((state) => ({
          language: lang,
          user: state.user ? { ...state.user, languagePref: lang } : state.user,
        })),

      setView: (view) => set({ currentView: view }),

      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'kariako-auth',
      partialize: (state) => ({
        user: state.user,
        guideProfile: state.guideProfile,
        badges: state.badges,
        isAuthenticated: state.isAuthenticated,
        language: state.language,
        currentView: state.currentView,
      }),
    }
  )
);
