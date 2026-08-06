import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { User } from '../types';

export interface AuthContextType {
  currentUser: User | null;
  authToken: string | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  handleLoginSuccess: (user: User, token: string) => void;
  handleLogout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
