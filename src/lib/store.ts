import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, Job } from '@/types';
import { api } from './services/api';

const ACCESS_KEY = '2une_access_token';
const REFRESH_KEY = '2une_refresh_token';

function hasStoredSession(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(localStorage.getItem(ACCESS_KEY) || localStorage.getItem(REFRESH_KEY));
}

interface AuthState {
  user: User | null;
  /** True after persist rehydrate from localStorage (client-only). */
  authReady: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  loginWithFirebase: (idToken: string) => Promise<void>;
  loginWithLinkedinHandoff: (handoff: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateUser: (data: Partial<User>, opts?: { silent?: boolean }) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      authReady: false,
      isLoading: true,
      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const user = await api.login(email, password);
          set({ user, isLoading: false });
        } catch (e) {
          set({ isLoading: false });
          throw e;
        }
      },
      loginWithFirebase: async (idToken) => {
        set({ isLoading: true });
        try {
          const user = await api.loginWithFirebase(idToken);
          set({ user, isLoading: false });
        } catch (e) {
          set({ isLoading: false });
          throw e;
        }
      },
      loginWithLinkedinHandoff: async (handoff) => {
        set({ isLoading: true });
        try {
          const user = await api.loginWithLinkedinHandoff(handoff);
          set({ user, isLoading: false });
        } catch (e) {
          set({ isLoading: false });
          throw e;
        }
      },
      logout: async () => {
        set({ isLoading: true });
        await api.logout();
        useAuthStore.persist.clearStorage();
        set({ user: null, isLoading: false });
      },
      checkAuth: async () => {
        set({ isLoading: true });
        const prevUser = get().user;
        const user = await api.getUserProfile();
        if (user) {
          set({ user, isLoading: false });
          return;
        }
        // Keep showing the last known user while tokens still exist but /users/me failed transiently.
        if (hasStoredSession() && prevUser) {
          set({ user: prevUser, isLoading: false });
          return;
        }
        set({ user: null, isLoading: false });
      },
      updateUser: async (data, opts) => {
        if (!opts?.silent) set({ isLoading: true });
        try {
          const user = await api.updateUserProfile(data);
          set({ user, isLoading: false });
        } catch (e) {
          set({ isLoading: false });
          throw e;
        }
      },
    }),
    {
      name: '2une_auth_session',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user }),
      version: 1,
      skipHydration: true,
    },
  ),
);

interface JobState {
  jobs: Job[];
  searchQuery: string;
  categoryFilter: string;
  isLoading: boolean;
  /** Omit or pass `{}` for all active projects; `payType` filters server-side. */
  fetchJobs: (filters?: { payType?: 'per_hour' | 'per_task' }) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (category: string) => void;
}

export const useJobStore = create<JobState>((set) => ({
  jobs: [],
  searchQuery: '',
  categoryFilter: 'All',
  isLoading: false,
  fetchJobs: async (filters) => {
    set({ isLoading: true });
    try {
      const jobs = await api.getJobs(1, 50, filters);
      set({ jobs, isLoading: false });
    } catch (e) {
      console.error('[jobs]', e);
      set({ jobs: [], isLoading: false });
    }
  },
  setSearchQuery: (query) => set({ searchQuery: query }),
  setCategoryFilter: (category) => set({ categoryFilter: category }),
}));
