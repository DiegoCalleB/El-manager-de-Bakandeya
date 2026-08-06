import React, { createContext, useContext, ReactNode } from 'react';
import { useAppData } from '../hooks/useAppData';
import { useAuthContext } from './AuthContext';

export type AppDataContextType = ReturnType<typeof useAppData>;

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuthContext();
  const appData = useAppData(isLoggedIn);

  return <AppDataContext.Provider value={appData}>{children}</AppDataContext.Provider>;
}

export function useAppDataContext(): AppDataContextType {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppDataContext must be used within an AppDataProvider');
  }
  return context;
}
