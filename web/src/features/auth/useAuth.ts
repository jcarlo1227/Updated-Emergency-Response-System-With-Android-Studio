import { createContext, useContext } from 'react';
import type { AdminAccount } from '@/types';

interface AuthContextValue {
  admin: AdminAccount | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
  admin: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);
