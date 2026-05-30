import { create } from 'zustand';

// ── TypeScript Interfaces (matching Prisma schema) ──

export interface MarketRequest {
  id: string;
  seekerId: string;
  description: string;
  zoneIds: string[]; // parsed from JSON
  budget: number;
  photoUrl: string | null;
  status: 'open' | 'matched' | 'active' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;

  // Joined relations (optional for display)
  seekerName?: string;
  seekerPhone?: string;
  zoneNames?: string[];
}

export interface Earnings {
  pending: number;
  released: number;
  weekly: number;
}

// ── Guide Store ──

interface GuideState {
  isOnline: boolean;
  status: 'online' | 'offline' | 'busy';
  liveRequests: MarketRequest[];
  earnings: Earnings;
  completedToday: number;
  currentZoneIds: string[];

  // Actions
  setOnline: (online: boolean) => void;
  setStatus: (status: 'online' | 'offline' | 'busy') => void;
  setLiveRequests: (requests: MarketRequest[]) => void;
  addLiveRequest: (request: MarketRequest) => void;
  removeLiveRequest: (requestId: string) => void;
  setEarnings: (earnings: Earnings) => void;
  setCompletedToday: (count: number) => void;
  incrementCompletedToday: () => void;
  setCurrentZoneIds: (zoneIds: string[]) => void;
  reset: () => void;
}

const initialState = {
  isOnline: false,
  status: 'offline' as const,
  liveRequests: [],
  earnings: { pending: 0, released: 0, weekly: 0 },
  completedToday: 0,
  currentZoneIds: [],
};

export const useGuideStore = create<GuideState>()((set) => ({
  ...initialState,

  setOnline: (online) =>
    set({ isOnline: online, status: online ? 'online' : 'offline' }),

  setStatus: (status) =>
    set({
      status,
      isOnline: status === 'online',
    }),

  setLiveRequests: (requests) => set({ liveRequests: requests }),

  addLiveRequest: (request) =>
    set((state) => ({
      liveRequests: [request, ...state.liveRequests],
    })),

  removeLiveRequest: (requestId) =>
    set((state) => ({
      liveRequests: state.liveRequests.filter((r) => r.id !== requestId),
    })),

  setEarnings: (earnings) => set({ earnings }),

  setCompletedToday: (count) => set({ completedToday: count }),

  incrementCompletedToday: () =>
    set((state) => ({ completedToday: state.completedToday + 1 })),

  setCurrentZoneIds: (zoneIds) => set({ currentZoneIds: zoneIds }),

  reset: () => set(initialState),
}));
