import { create } from 'zustand';
import type { User } from './auth-store';

// ── TypeScript Interfaces (matching Prisma schema) ──

export interface Session {
  id: string;
  requestId: string;
  guideId: string;
  seekerId: string;
  sessionCode: string;
  startedAt: string | null;
  completedAt: string | null;
  escrowStatus: 'pending' | 'held' | 'released' | 'refunded' | 'disputed';
  amount: number;
  platformFee: number;
  ratingSeeker: number | null;
  ratingGuide: number | null;
  reviewSeeker: string | null;
  reviewGuide: string | null;
  disputeFlag: boolean;
  disputeReason: string | null;
  emergencyFlag: boolean;
  seekerConfirmed: boolean;
  guideConfirmed: boolean;
  createdAt: string;
  updatedAt: string;

  // Joined relations
  guide?: User;
  seeker?: User;
}

export interface Message {
  id: string;
  sessionId: string;
  senderId: string;
  content: string;
  translatedContent: string | null;
  createdAt: string;

  // Joined relation
  sender?: User;
}

// ── Session Store ──

interface SessionState {
  activeSession: Session | null;
  messages: Message[];
  sessionCode: string;
  isChatOpen: boolean;
  isConnecting: boolean;
  sessionHistory: Session[];

  // Actions
  setActiveSession: (session: Session | null) => void;
  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
  clearSession: () => void;
  toggleChat: () => void;
  setChatOpen: (open: boolean) => void;
  setSessionCode: (code: string) => void;
  setConnecting: (connecting: boolean) => void;
  setSessionHistory: (sessions: Session[]) => void;
  updateSession: (updates: Partial<Session>) => void;
}

export const useSessionStore = create<SessionState>()((set) => ({
  activeSession: null,
  messages: [],
  sessionCode: '',
  isChatOpen: false,
  isConnecting: false,
  sessionHistory: [],

  setActiveSession: (session) =>
    set({
      activeSession: session,
      sessionCode: session?.sessionCode || '',
      isChatOpen: session !== null,
    }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  setMessages: (messages) => set({ messages }),

  clearSession: () =>
    set({
      activeSession: null,
      messages: [],
      sessionCode: '',
      isChatOpen: false,
    }),

  toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),

  setChatOpen: (open) => set({ isChatOpen: open }),

  setSessionCode: (code) => set({ sessionCode: code }),

  setConnecting: (connecting) => set({ isConnecting: connecting }),

  setSessionHistory: (sessions) => set({ sessionHistory: sessions }),

  updateSession: (updates) =>
    set((state) => ({
      activeSession: state.activeSession
        ? { ...state.activeSession, ...updates }
        : null,
    })),
}));
