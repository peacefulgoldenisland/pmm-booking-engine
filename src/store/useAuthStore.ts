import { create } from 'zustand';
import type { User, Role } from '@/types/user';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  hasAccess: (menuId: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  
  // RBAC Helper
  hasAccess: (menuId: string) => {
    const { user } = get();
    if (!user) return false;
    
    // Superadmin always has access
    if (user.role === 'superadmin') return true;
    
    // Check specific allowed menus for 'admin'
    if (user.role === 'admin') {
       return user.allowedMenus?.includes(menuId) || false;
    }
    
    return false;
  }
}));
