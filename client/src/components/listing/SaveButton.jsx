import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api, { errorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const SavedContext = createContext(null);

// Loads the traveller's saved ids once so every heart on the page knows its state.
export function SavedProvider({ children }) {
  const { role } = useAuth();
  const [ids, setIds] = useState(new Set());

  useEffect(() => {
    if (role !== 'user') return setIds(new Set());
    api.get('/saved/ids').then((res) => setIds(new Set(res.data.data))).catch(() => {});
    return undefined;
  }, [role]);

  const toggle = useCallback(async (itemType, itemId) => {
    const res = await api.post('/saved/toggle', { itemType, itemId });
    setIds((prev) => {
      const next = new Set(prev);
      if (res.data.saved) next.add(itemId);
      else next.delete(itemId);
      return next;
    });
    return res.data.saved;
  }, []);

  return <SavedContext.Provider value={{ ids, toggle }}>{children}</SavedContext.Provider>;
}

export default function SaveButton({ itemType, itemId }) {
  const ctx = useContext(SavedContext);
  const { user, role } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  if (!ctx || (user && role !== 'user')) return null;
  const saved = ctx.ids.has(itemId);

  const onClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return navigate('/login');
    try {
      const nowSaved = await ctx.toggle(itemType, itemId);
      toast.success(nowSaved ? 'Saved to your list' : 'Removed from saved');
    } catch (err) {
      toast.error(errorMessage(err));
    }
    return undefined;
  };

  return (
    <button type="button" className={`save-btn ${saved ? 'saved' : ''}`} onClick={onClick} aria-pressed={saved} aria-label={saved ? 'Remove from saved' : 'Save'}>
      <Heart size={16} fill={saved ? 'currentColor' : 'none'} />
    </button>
  );
}
