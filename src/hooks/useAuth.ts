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

  // Verify auth session on mount
  useEffect(() => {
    if (authToken) {
      api.verifyMe()
        .then(data => {
          if (data && data.user) {
            setCurrentUser(data.user);
            setAvailableBands(data.availableBands || []);
            localStorage.setItem('bakandeya_user', JSON.stringify(data.user));
            localStorage.setItem('bakandeya_available_bands', JSON.stringify(data.availableBands || []));
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
          const savedBandsStr = localStorage.getItem('bakandeya_available_bands');
          if (savedBandsStr) {
            try {
              const bands = JSON.parse(savedBandsStr);
              setAvailableBands(bands);
            } catch (e) {}
          }
          setCurrentUser(null);
          setAuthToken(null);
          setIsLoggedIn(false);
          localStorage.removeItem('bakandeya_token');
          localStorage.removeItem('bakandeya_user');
          localStorage.removeItem('bakandeya_logged_in');
          localStorage.removeItem('bakandeya_available_bands');
        });
    }
  }, [authToken]);

  const handleLoginSuccess = useCallback((user: User, token: string, bandsList?: any[]) => {
    setCurrentUser(user);
    setAuthToken(token);
    if (bandsList) {
      setAvailableBands(bandsList);
      localStorage.setItem('bakandeya_available_bands', JSON.stringify(bandsList));
    }
    localStorage.setItem('bakandeya_token', token);
    localStorage.setItem('bakandeya_user', JSON.stringify(user));
    localStorage.setItem('bakandeya_logged_in', 'true');
    setIsLoggedIn(true);
  }, []);

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
  }, [authToken]);

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
