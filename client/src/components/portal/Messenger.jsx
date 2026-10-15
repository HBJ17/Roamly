import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Send, MessageCircle } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useToast } from '../../context/ToastContext';
import { EmptyState, Spinner, formatDateTime } from '../ui';

/**
 * Conversation list + thread, shared by travellers and partners.
 * basePath: '/account/messages' or '/agency/messages'
 */
export default function Messenger({ basePath }) {
  const { id } = useParams();
  const { role } = useAuth();
  const { onMessage, refresh: refreshBell } = useNotifications();
  const toast = useToast();
  const navigate = useNavigate();
  const [threads, setThreads] = useState(null);
  const [thread, setThread] = useState(null);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const bottom = useRef(null);
  const mineType = role === 'agency' ? 'agency' : 'user';
  const unreadKey = role === 'agency' ? 'unreadForAgency' : 'unreadForUser';

  const loadThreads = useCallback(async () => {
    try {
      const res = await api.get('/conversations');
      setThreads(res.data.data);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }, [toast]);

  const loadThread = useCallback(async (threadId) => {
    try {
      const res = await api.get(`/conversations/${threadId}/messages`);
      setThread(res.data.data);
      setThreads((list) => list?.map((t) => (t._id === threadId ? { ...t, [unreadKey]: 0 } : t)));
      refreshBell();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }, [toast, unreadKey, refreshBell]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    if (id) loadThread(id);
    else setThread(null);
  }, [id, loadThread]);

  // New messages arrive over the socket.
  useEffect(() => onMessage(({ conversationId, message }) => {
    if (thread && conversationId === thread.conversation._id) {
      setThread((t) => (t.messages.some((m) => m._id === message._id) ? t : { ...t, messages: [...t.messages, message] }));
    }
    loadThreads();
  }), [onMessage, thread, loadThreads]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' });
  }, [thread?.messages.length]);

  const send = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    try {
      const res = await api.post(`/conversations/${id}/messages`, { body });
      setThread((t) => ({ ...t, messages: t.messages.some((m) => m._id === res.data.data._id) ? t.messages : [...t.messages, res.data.data] }));
      setBody('');
      loadThreads();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSending(false);
    }
  };

  if (!threads) return <Spinner />;
  if (!threads.length) {
    return (
      <EmptyState icon={MessageCircle} title="No conversations yet">
        {role === 'agency' ? 'Travellers can message you from your listings and their bookings.' : 'Ask a hotel, driver or tour host a question from their page or your booking.'}
      </EmptyState>
    );
  }

  const counterpart = (c) => (role === 'agency' ? c.user?.fullName || c.user?.username : c.agency?.name);

  return (
    <div className="chat">
      <div className="chat-list">
        {threads.map((c) => (
          <button key={c._id} type="button" className={`thread-item ${c._id === id ? 'active' : ''}`} onClick={() => navigate(`${basePath}/${c._id}`)}>
            <span className="row-between" style={{ flexWrap: 'nowrap' }}><b>{counterpart(c)}</b>{c[unreadKey] > 0 && <span className="unread">{c[unreadKey]}</span>}</span>
            <span className="small">{c.subject}</span>
            <span className="small muted">{c.lastMessage}</span>
          </button>
        ))}
      </div>
      <div className="card chat-thread" style={{ padding: 14 }}>
        {!thread ? <p className="muted">Choose a conversation.</p> : (
          <>
            <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: 8, marginBottom: 8 }}>
              <b>{counterpart(thread.conversation)}</b>
              <div className="small muted">{thread.conversation.subject}{thread.conversation.bookingReference ? ` · ${thread.conversation.bookingReference}` : ''}</div>
            </div>
            <div className="chat-messages">
              {thread.messages.map((m) => (
                <div key={m._id} className={`bubble ${m.senderType === mineType ? 'mine' : ''}`}>
                  {m.body}
                  <small>{m.senderName} · {formatDateTime(m.createdAt)}</small>
                </div>
              ))}
              <div ref={bottom} />
            </div>
            <form onSubmit={send} className="row" style={{ flexWrap: 'nowrap', marginTop: 10 }}>
              <input className="form-control" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a message" maxLength={2000} aria-label="Message" />
              <button type="submit" className="btn btn-primary" disabled={sending || !body.trim()}><Send size={14} /></button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
