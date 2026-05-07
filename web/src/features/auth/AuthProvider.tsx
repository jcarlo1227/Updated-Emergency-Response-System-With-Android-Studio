import { useState, useEffect, type ReactNode } from 'react';
import { api } from '@/services/apiClient';
import { connectSocket, disconnectSocket } from '@/services/socketClient';
import type { AdminAccount, AuthResponse } from '@/types';
import { AuthContext } from './useAuth';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [admin, setAdmin] = useState<AdminAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_access_token');
    if (!token) { setIsLoading(false); return; }
    api.get<{ data: { role: string; account: AdminAccount } }>('/auth/me')
      .then(({ data }) => {
        if (data.data.role === 'admin') {
          setAdmin(data.data.account);
          connectSocket();
        } else {
          localStorage.removeItem('admin_access_token');
          localStorage.removeItem('admin_refresh_token');
        }
      })
      .catch(() => {
        localStorage.removeItem('admin_access_token');
        localStorage.removeItem('admin_refresh_token');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post<{ data: AuthResponse }>('/auth/login', {
      email,
      password,
      role: 'admin',
    });
    const { accessToken, refreshToken, account } = data.data;
    localStorage.setItem('admin_access_token', accessToken);
    localStorage.setItem('admin_refresh_token', refreshToken);
    setAdmin({ ...account, role: 'admin' } as AdminAccount);
    connectSocket();
  };

  const logout = async () => {
    try {
      const refresh = localStorage.getItem('admin_refresh_token');
      if (refresh) await api.post('/auth/logout', { refreshToken: refresh });
    } finally {
      localStorage.removeItem('admin_access_token');
      localStorage.removeItem('admin_refresh_token');
      setAdmin(null);
      disconnectSocket();
    }
  };

  return (
    <AuthContext.Provider value={{ admin, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
