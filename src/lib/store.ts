import { create } from 'zustand';
import { User, Job } from '@/types';
import { api } from './services/api';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  loginWithLinkedinHandoff: (handoff: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateUser: (data: Partial<User>, opts?: { silent?: boolean }) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
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
  loginWithGoogle: async (idToken) => {
    set({ isLoading: true });
    try {
      const user = await api.loginWithGoogle(idToken);
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
    set({ user: null, isLoading: false });
  },
  checkAuth: async () => {
    set({ isLoading: true });
    const user = await api.getUserProfile();
    set({ user, isLoading: false });
  },
  updateUser: async (data: Partial<User>, opts?: { silent?: boolean }) => {
    if (!opts?.silent) set({ isLoading: true });
    try {
      const user = await api.updateUserProfile(data);
      set({ user, isLoading: false });
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },
}));

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
