import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { onUnauthorized } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await api.get('/auth/session');
      setUser(res.data.user);
      return res.data.user;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    return onUnauthorized(() => setUser(null));
  }, [refresh]);

  const login = async (username, password, loginType = 'user') => {
    const res = await api.post('/auth/login', { username, password, loginType });
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    setUser(res.data.user);
    return res.data.user;
  };

  const registerAgency = async (data) => {
    const res = await api.post('/auth/agency/register', data);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
    }
  };

  const updateUser = (patch) => setUser((prev) => (prev ? { ...prev, ...patch } : prev));

  const value = useMemo(
    () => ({ user, role: user?.role || null, loading, login, register, registerAgency, logout, refresh, updateUser, setUser }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
