import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Language } from '@/lib/i18n';

// ── Cookie helper for middleware sync ──
function setRoleCookie(role: string) {
  if (typeof document !== 'undefined') {
    document.cookie = `user_role=${role}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
  }
}

function clearRoleCookie() {
  if (typeof document !== 'undefined') {
    document.cookie = 'user_role=; path=/; max-age=0';
  }
}

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
  walletBalance: number;
  subscriptionTier: string; // starter, pro, elite

  // Actions
  login: (identifier: string, role?: string, name?: string, password?: string) => Promise<void>;
  loginWithEmail: (email: string, password: string, name?: string, role?: string) => Promise<void>;
  socialLogin: (provider: string, providerId: string, email: string, name: string, avatarUrl?: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setGuideProfile: (profile: GuideProfile | null) => void;
  setBadges: (badges: Badge[]) => void;
  setLanguage: (lang: Language) => void;
  setView: (view: string) => void;
  setLoading: (loading: boolean) => void;
  updateProfile: (updates: Partial<Pick<User, 'name' | 'email' | 'phone' | 'avatarUrl'>>) => void;
  setWalletBalance: (balance: number) => void;
  setSubscriptionTier: (tier: string) => void;
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
      walletBalance: 47500,
      subscriptionTier: 'starter',

      login: async (identifier: string, role?: string, name?: string, password?: string) => {
        set({ isLoading: true });
        try {
          // Determine if identifier is email or phone
          const isEmail = identifier.includes('@');
          const body: Record<string, string | undefined> = { role, name, password };
          if (isEmail) {
            body.email = identifier;
          } else {
            body.phone = identifier;
          }

          const res = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
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
          // Set cookie for middleware route protection
          if (data.user?.role) setRoleCookie(data.user.role);
        } catch {
          set({ isLoading: false });
          throw new Error('Login failed');
        }
      },

      loginWithEmail: async (email: string, password: string, name?: string, role?: string) => {
        set({ isLoading: true });
        try {
          const res = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name, role }),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || 'Login failed');
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
          // Set cookie for middleware route protection
          if (data.user?.role) setRoleCookie(data.user.role);
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
          // Set cookie for middleware route protection
          if (data.user?.role) setRoleCookie(data.user.role);
        } catch {
          set({ isLoading: false });
          throw new Error('Social login failed');
        }
      },

      logout: () => {
        clearRoleCookie();
        set({
          user: null,
          guideProfile: null,
          badges: [],
          isAuthenticated: false,
          currentView: 'auth',
          walletBalance: 0,
          subscriptionTier: 'starter',
        });
      },

      setUser: (user) => {
        if (user.role) setRoleCookie(user.role);
        set({ user, isAuthenticated: true, language: (user.languagePref as Language) || 'sw' });
      },

      setGuideProfile: (profile) => set({ guideProfile: profile }),

      setBadges: (badges) => set({ badges }),

      setLanguage: (lang) =>
        set((state) => ({
          language: lang,
          user: state.user ? { ...state.user, languagePref: lang } : state.user,
        })),

      setView: (view) => set({ currentView: view }),

      setLoading: (loading) => set({ isLoading: loading }),

      updateProfile: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates, updatedAt: new Date().toISOString() } : state.user,
        })),

      setWalletBalance: (balance) => set({ walletBalance: balance }),

      setSubscriptionTier: (tier) => set({ subscriptionTier: tier }),
    }),
    {
      name: 'chimbo-auth',
      partialize: (state) => ({
        user: state.user,
        guideProfile: state.guideProfile,
        badges: state.badges,
        isAuthenticated: state.isAuthenticated,
        language: state.language,
        currentView: state.currentView,
        walletBalance: state.walletBalance,
        subscriptionTier: state.subscriptionTier,
      }),
      onRehydrateStorage: () => (state) => {
        // Sync the role cookie when zustand rehydrates from localStorage
        // This ensures middleware has the correct role on page refresh
        if (state?.isAuthenticated && state.user?.role) {
          setRoleCookie(state.user.role);
        } else if (!state?.isAuthenticated) {
          clearRoleCookie();
        }
      },
    }
  )
);
