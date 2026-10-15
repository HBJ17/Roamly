import React, { useState } from 'react';
import { ThumbsUp, BadgeCheck, MessageSquareReply } from 'lucide-react';
import useApi from '../../hooks/useApi';
import api, { errorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Stars, Pagination, formatDate } from '../ui';

export default function ReviewsSection({ itemType, itemId, rating, count }) {
  const [page, setPage] = useState(1);
  const { body, reload } = useApi(`/reviews/${itemType}/${itemId}`, { params: { page, limit: 6 } });
  const { role } = useAuth();
  const toast = useToast();

  const helpful = async (id) => {
    try {
      await api.post(`/reviews/${id}/helpful`);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const breakdown = body?.breakdown || {};
  const total = body?.total || 0;

  return (
    <section className="section">
      <div className="row-between">
        <h2 className="section-title">Guest reviews</h2>
        <Stars value={rating} count={count} size={15} />
      </div>
      {total > 0 && (
        <div className="stack" style={{ gap: 4, maxWidth: 360, marginBottom: 14 }}>
          {[5, 4, 3, 2, 1].map((n) => (
            <div key={n} className="row small" style={{ flexWrap: 'nowrap' }}>
              <span style={{ width: 24 }}>{n}★</span>
              <div style={{ flex: 1, height: 8, borderRadius: 99, background: 'var(--sand-deep)', overflow: 'hidden' }}>
                <div style={{ width: `${((breakdown[n] || 0) / total) * 100}%`, height: '100%', background: 'var(--sun)' }} />
              </div>
              <span style={{ width: 24, textAlign: 'right' }}>{breakdown[n] || 0}</span>
            </div>
          ))}
        </div>
      )}
      {total === 0 && <p className="muted">No reviews yet. Reviews come only from guests who completed a booking.</p>}
      <div className="card" style={{ padding: '4px 18px', display: total ? 'block' : 'none' }}>
        {(body?.data || []).map((r) => (
          <article key={r._id} className="review">
            <div className="row-between">
              <b>{r.title}</b>
              <Stars value={r.rating} />
            </div>
            <p className="small muted"><BadgeCheck size={12} /> {r.user?.fullName || r.user?.username} · {r.travelType} trip · {formatDate(r.createdAt)}</p>
            <p style={{ marginTop: 6 }}>{r.comment}</p>
            {r.agencyReply?.message && (
              <div className="review-reply"><MessageSquareReply size={12} /> <b>Response from the partner:</b> {r.agencyReply.message}</div>
            )}
            {role === 'user' && (
              <button type="button" className="btn btn-sm btn-outline" style={{ marginTop: 8 }} onClick={() => helpful(r._id)}>
                <ThumbsUp size={12} /> Helpful ({r.helpfulCount})
              </button>
            )}
          </article>
        ))}
      </div>
      <Pagination page={body?.page || 1} pages={body?.pages || 1} onChange={setPage} />
    </section>
  );
}
