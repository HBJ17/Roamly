import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import api from '../api/client';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

/**
 * Keeps the unread notification count live. A Socket.IO connection (authenticated by the
 * session cookie) pushes new notifications and chat messages; other components subscribe via `onMessage`.
 */
const NotificationContext = createContext({ unread: 0, refresh: () => {}, onMessage: () => () => {} });

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const [unread, setUnread] = useState(0);
  const messageListeners = useRef(new Set());

  const refresh = useCallback(async () => {
    if (!user) return setUnread(0);
    try {
      const res = await api.get('/notifications', { params: { unread: true } });
      setUnread(res.data.unread);
    } catch {
      /* ignore */
    }
    return undefined;
  }, [user]);

  useEffect(() => {
    refresh();
    if (!user) return undefined;

    const socket = io(import.meta.env.VITE_SOCKET_URL || '/', { path: '/socket.io', withCredentials: true, transports: ['websocket', 'polling'] });
    socket.on('notification', (n) => {
      setUnread((c) => c + 1);
      if (n.notificationType !== 'message') toast.info(n.title);
    });
    socket.on('message', (payload) => messageListeners.current.forEach((fn) => fn(payload)));
    return () => socket.disconnect();
  }, [user, refresh, toast]);

  const value = useMemo(() => ({
    unread,
    refresh,
    onMessage: (fn) => {
      messageListeners.current.add(fn);
      return () => messageListeners.current.delete(fn);
    }
  }), [unread, refresh]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export const useNotifications = () => useContext(NotificationContext);
