import { create } from 'zustand';

interface UserState {
  user: any | null;
  setUser: (u: any) => void;
  // TODO: Add more state
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (u) => set({ user: u }),
}));
