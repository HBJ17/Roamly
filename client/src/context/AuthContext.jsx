import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem('roamly_token');
      const savedUser = localStorage.getItem('roamly_user');
      
      if (savedToken && savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          setUser(parsed);
          setRole(parsed.role || 'user');
          
          // Verify with backend
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
            setRole(res.data.role);
            localStorage.setItem('roamly_user', JSON.stringify({ ...res.data.user, role: res.data.role }));
          }
        } catch (err) {
          localStorage.removeItem('roamly_token');
          localStorage.removeItem('roamly_user');
          setUser(null);
          setRole(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (username, password, loginType = 'user') => {
    const res = await api.post('/auth/login', { username, password, loginType });
    if (res.data.success) {
      localStorage.setItem('roamly_token', res.data.token);
      localStorage.setItem('roamly_user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      setRole(res.data.user.role);
      return res.data;
    }
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    if (res.data.success) {
      localStorage.setItem('roamly_token', res.data.token);
      localStorage.setItem('roamly_user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      setRole('user');
      return res.data;
    }
  };

  const registerAgency = async (agencyData) => {
    const res = await api.post('/auth/agency/register', agencyData);
    if (res.data.success) {
      localStorage.setItem('roamly_token', res.data.token);
      localStorage.setItem('roamly_user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      setRole('agency');
      return res.data;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {}
    localStorage.removeItem('roamly_token');
    localStorage.removeItem('roamly_user');
    setUser(null);
    setRole(null);
  };

  const updateUser = (updatedData) => {
    setUser((prev) => ({ ...prev, ...updatedData }));
    const saved = JSON.parse(localStorage.getItem('roamly_user') || '{}');
    localStorage.setItem('roamly_user', JSON.stringify({ ...saved, ...updatedData }));
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, login, register, registerAgency, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
