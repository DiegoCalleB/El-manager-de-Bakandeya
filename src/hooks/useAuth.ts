import { useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { api } from '../services/api';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('bakandeya_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });

  const [authToken, setAuthToken] = useState<string | null>(() => {
    return localStorage.getItem('bakandeya_token') || null;
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return !!localStorage.getItem('bakandeya_token') || localStorage.getItem('bakandeya_logged_in') === 'true';
  });

  const isAdmin = Boolean(currentUser && currentUser.role === 'leader');

  // Verify auth session on mount
  useEffect(() => {
    if (authToken) {
      api.verifyMe()
        .then(data => {
          if (data && data.user) {
            setCurrentUser(data.user);
            localStorage.setItem('bakandeya_user', JSON.stringify(data.user));
            setIsLoggedIn(true);
          }
        })
        .catch(err => {
          console.warn('Verification failed or offline:', err);
          // If we have local user saved, keep logged in offline/fallback
          const savedUserStr = localStorage.getItem('bakandeya_user');
          if (savedUserStr) {
            try {
              const u = JSON.parse(savedUserStr);
              setCurrentUser(u);
              setIsLoggedIn(true);
              return;
            } catch (e) {}
          }
          setCurrentUser(null);
          setAuthToken(null);
          setIsLoggedIn(false);
          localStorage.removeItem('bakandeya_token');
          localStorage.removeItem('bakandeya_user');
          localStorage.removeItem('bakandeya_logged_in');
        });
    }
  }, [authToken]);

  const handleLoginSuccess = useCallback((user: User, token: string) => {
    setCurrentUser(user);
    setAuthToken(token);
    localStorage.setItem('bakandeya_token', token);
    localStorage.setItem('bakandeya_user', JSON.stringify(user));
    localStorage.setItem('bakandeya_logged_in', 'true');
    setIsLoggedIn(true);
  }, []);

  const handleLogout = useCallback(async () => {
    if (authToken) {
      try {
        await api.logout(authToken);
      } catch (e) {
        console.error('Error logging out on server:', e);
      }
    }
    setCurrentUser(null);
    setAuthToken(null);
    setIsLoggedIn(false);
    localStorage.removeItem('bakandeya_token');
    localStorage.removeItem('bakandeya_user');
    localStorage.removeItem('bakandeya_logged_in');
  }, [authToken]);

  return {
    currentUser,
    authToken,
    isLoggedIn,
    isAdmin,
    setCurrentUser,
    handleLoginSuccess,
    handleLogout
  };
}
