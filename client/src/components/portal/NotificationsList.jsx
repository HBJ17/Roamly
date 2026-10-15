import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import useApi from '../../hooks/useApi';
import api from '../../api/client';
import { useNotifications } from '../../context/NotificationContext';
import { EmptyState, Spinner, formatDateTime } from '../ui';

export default function NotificationsList() {
  const { data, loading, reload } = useApi('/notifications');
  const { refresh } = useNotifications();

  const markAll = async () => {
    await api.put('/notifications/read-all');
    reload();
    refresh();
  };
  const markOne = async (id) => {
    await api.put(`/notifications/${id}/read`);
    reload();
    refresh();
  };

  if (loading) return <Spinner />;
  if (!data?.length) return <EmptyState icon={Bell} title="You're all caught up" />;

  return (
    <div className="stack">
      <div className="row-between">
        <h2 className="section-title" style={{ marginBottom: 0 }}>Notifications</h2>
        <button type="button" className="btn btn-sm btn-outline" onClick={markAll}><CheckCheck size={13} /> Mark all read</button>
      </div>
      {data.map((n) => (
        <div key={n._id} className="card" style={{ padding: 14, background: n.isRead ? '#fff' : 'var(--pastel-yellow-light)' }}>
          <div className="row-between">
            <b>{n.title}</b>
            <span className="small muted">{formatDateTime(n.createdAt)}</span>
          </div>
          <p className="small" style={{ margin: '4px 0 8px' }}>{n.message}</p>
          <div className="row">
            {n.linkUrl && <Link className="btn btn-sm btn-yellow" to={n.linkUrl} onClick={() => !n.isRead && markOne(n._id)}>Open</Link>}
            {!n.isRead && <button type="button" className="btn btn-sm btn-outline" onClick={() => markOne(n._id)}>Mark read</button>}
          </div>
        </div>
      ))}
    </div>
  );
}
