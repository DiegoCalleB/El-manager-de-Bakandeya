import { useState, useCallback } from 'react';

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  timestamp: number;
}

export function useNotificationSystem() {
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  const addNotification = useCallback((type: ToastNotification['type'], title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newToast: ToastNotification = { id, type, title, message, timestamp: Date.now() };

    setNotifications(prev => [...prev.slice(-4), newToast]); // keep max 5 active

    setTimeout(() => {
      setNotifications(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(t => t.id !== id));
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    notifySuccess: (title: string, msg?: string) => addNotification('success', title, msg),
    notifyError: (title: string, msg?: string) => addNotification('error', title, msg),
    notifyInfo: (title: string, msg?: string) => addNotification('info', title, msg),
    notifyWarning: (title: string, msg?: string) => addNotification('warning', title, msg),
  };
}
