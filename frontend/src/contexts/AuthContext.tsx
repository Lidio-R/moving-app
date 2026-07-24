import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../api/client';

interface User {
  id: number;
  phone: string;
  name: string;
  avatar: string;
  is_admin: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (phone: string, password: string) => Promise<void>;
  register: (phone: string, name: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (phone: string, password: string) => {
    const res = await api.post('/users/login', { phone, password });
    const { access_token, user: u } = res.data;
    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify(u));
    setToken(access_token);
    setUser(u);
  };

  const register = async (phone: string, name: string, password: string) => {
    const res = await api.post('/users/register', { phone, name, password });
    const { access_token, user: u } = res.data;
    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify(u));
    setToken(access_token);
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isAdmin: user?.is_admin ?? false }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
