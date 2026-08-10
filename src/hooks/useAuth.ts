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

  const [availableBands, setAvailableBands] = useState<any[]>(() => {
    try {
      const savedBands = localStorage.getItem('bakandeya_available_bands');
      return savedBands ? JSON.parse(savedBands) : [];
    } catch (e) {
      return [];
    }
  });

  const isAdmin = Boolean(currentUser && currentUser.role === 'leader');

  // Set 30-day cookie helper
  const syncSessionCookie = useCallback((token: string) => {
    try {
      document.cookie = `bakandeya_token=${token}; max-age=${30 * 24 * 60 * 60}; path=/; SameSite=Lax`;
    } catch (e) {}
  }, []);

  // Silent session refresh function
  const refreshSession = useCallback(async () => {
    const tokenToUse = authToken || localStorage.getItem('bakandeya_token');
    if (!tokenToUse) return;

    try {
      const data = await api.verifyMe();
      if (data && data.user) {
        setCurrentUser(data.user);
        setAvailableBands(data.availableBands || []);
        localStorage.setItem('bakandeya_user', JSON.stringify(data.user));
        localStorage.setItem('bakandeya_available_bands', JSON.stringify(data.availableBands || []));
        if (data.token) {
          setAuthToken(data.token);
          localStorage.setItem('bakandeya_token', data.token);
          syncSessionCookie(data.token);
        } else {
          syncSessionCookie(tokenToUse);
        }
        setIsLoggedIn(true);
      }
    } catch (err: any) {
      console.warn('Silent session refresh skipped or offline:', err?.message || err);
      // Only logout if server explicitly rejected auth with 401
      const isExplicit401 = err?.status === 401 || err?.message?.includes('401') || err?.message?.includes('no autorizable') || err?.message?.includes('no válida');
      if (isExplicit401 && !navigator.onLine) {
        // Device is offline: keep cached session active on phone!
        const savedUserStr = localStorage.getItem('bakandeya_user');
        if (savedUserStr) {
          try {
            setCurrentUser(JSON.parse(savedUserStr));
            setIsLoggedIn(true);
            return;
          } catch (e) {}
        }
      } else if (isExplicit401) {
        // Unrecoverable invalid session
        setCurrentUser(null);
        setAuthToken(null);
        setIsLoggedIn(false);
        localStorage.removeItem('bakandeya_token');
        localStorage.removeItem('bakandeya_user');
        localStorage.removeItem('bakandeya_logged_in');
        localStorage.removeItem('bakandeya_available_bands');
        try {
          document.cookie = 'bakandeya_token=; max-age=0; path=/;';
        } catch (e) {}
      }
    }
  }, [authToken, syncSessionCookie]);

  // Initial verification on mount
  useEffect(() => {
    if (authToken) {
      syncSessionCookie(authToken);
      refreshSession();
    }
  }, [authToken, refreshSession, syncSessionCookie]);

  // Periodic silent background refresh (every 15 mins) & mobile app resume
  useEffect(() => {
    if (!isLoggedIn || !authToken) return;

    // Refresh every 15 minutes in background
    const intervalId = setInterval(() => {
      refreshSession();
    }, 15 * 60 * 1000);

    // Refresh on page focus / tab switch (mobile phone unlock)
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        refreshSession();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [isLoggedIn, authToken, refreshSession]);

  const handleLoginSuccess = useCallback((user: User, token: string, bandsList?: any[]) => {
    setCurrentUser(user);
    setAuthToken(token);
    syncSessionCookie(token);
    if (bandsList) {
      setAvailableBands(bandsList);
      localStorage.setItem('bakandeya_available_bands', JSON.stringify(bandsList));
    }
    localStorage.setItem('bakandeya_token', token);
    localStorage.setItem('bakandeya_user', JSON.stringify(user));
    localStorage.setItem('bakandeya_remember_me', 'true');
    localStorage.setItem('bakandeya_logged_in', 'true');
    setIsLoggedIn(true);
  }, [syncSessionCookie]);

  const handleSwitchBand = useCallback(async (band_id: string) => {
    const tokenToUse = authToken || localStorage.getItem('bakandeya_token');
    const response = await fetch('/api/auth/switch-band', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(tokenToUse ? { 'Authorization': `Bearer ${tokenToUse}` } : {})
      },
      body: JSON.stringify({ band_id })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || 'Error al cambiar de banda');
    }

    if (data.token) {
      setAuthToken(data.token);
      localStorage.setItem('bakandeya_token', data.token);
      syncSessionCookie(data.token);
    }
    if (data.user) {
      setCurrentUser(data.user);
      localStorage.setItem('bakandeya_user', JSON.stringify(data.user));
    }
    if (data.availableBands) {
      setAvailableBands(data.availableBands);
      localStorage.setItem('bakandeya_available_bands', JSON.stringify(data.availableBands));
    }
    return data.user;
  }, [authToken, syncSessionCookie]);

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
    setAvailableBands([]);
    setIsLoggedIn(false);
    localStorage.removeItem('bakandeya_token');
    localStorage.removeItem('bakandeya_user');
    localStorage.removeItem('bakandeya_logged_in');
    localStorage.removeItem('bakandeya_available_bands');
    try {
      document.cookie = 'bakandeya_token=; max-age=0; path=/;';
    } catch (e) {}
  }, [authToken]);

  return {
    currentUser,
    authToken,
    isLoggedIn,
    isAdmin,
    availableBands,
    setCurrentUser,
    handleLoginSuccess,
    handleSwitchBand,
    handleLogout
  };
}
